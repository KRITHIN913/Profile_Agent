import asyncio
import uuid
import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from openai import AsyncOpenAI

from app.agents.researcher import run_research
from app.agents.extractor import run_extraction
from app.agents.validator import run_validation

logger = logging.getLogger(__name__)

# In-memory store for demo/scaffold purposes
# In production, use Redis or PostgreSQL
JOB_STORE: Dict[str, Dict[str, Any]] = {}

# Timeouts in seconds (Extended to handle 429 Rate Limit sleep backoffs)
TIMEOUT_RESEARCHER = 600.0
TIMEOUT_EXTRACTOR = 600.0
TIMEOUT_VALIDATOR = 60.0

def create_job(name: str, context: dict) -> str:
    """Initializes a new job state and returns the job_id."""
    job_id = str(uuid.uuid4())
    JOB_STORE[job_id] = {
        "job_id": job_id,
        "name": name,
        "context": context,
        "phase": "pending",
        "status": "queued",
        "events": [], # Store historical events for reconnection
        "profile": None,
        "partial": False
    }
    return job_id

def _add_event(job_id: str, phase: str, status: str, **kwargs):
    """Appends an event to the job's history for SSE broadcasting and state polling."""
    if job_id not in JOB_STORE:
        return
        
    event = {
        "phase": phase,
        "status": status,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **kwargs
    }
    JOB_STORE[job_id]["events"].append(event)
    JOB_STORE[job_id]["phase"] = phase
    JOB_STORE[job_id]["status"] = status
    
    # Store profile if provided in kwargs
    if "profile" in kwargs:
        JOB_STORE[job_id]["profile"] = kwargs["profile"]
        
async def get_job_events_generator(job_id: str, start_idx: int = 0):
    """
    Generator yielding Server-Sent Events (SSE).
    Uses a heartbeat to keep connections alive.
    """
    if job_id not in JOB_STORE:
        yield {"event": "error", "data": '{"message": "Job not found"}'}
        return

    last_idx = start_idx
    
    while True:
        job = JOB_STORE.get(job_id)
        if not job:
            break
            
        # Yield any new events
        events_len = len(job["events"])
        if last_idx < events_len:
            for event in job["events"][last_idx:events_len]:
                yield {"event": "message", "data": json.dumps(event)}
            last_idx = events_len
            
            # Break if complete
            if job["phase"] == "complete" or job["status"] in ("failed", "partial_complete"):
                break
                
        # Heartbeat to prevent timeouts
        yield {"event": "ping", "data": ""}
        
        await asyncio.sleep(1) # Poll for new events

async def run_pipeline(job_id: str, name: str, context: dict):
    """
    Executes the pipeline (Researcher -> Extractor -> Validator).
    Handles timeouts and partial failures without crashing the entire job.
    """
    corpus = None
    profile = None
    partial_failure = False
    
    _add_event(job_id, "researcher", "running", message="Searching for background, net worth, and affiliations...")
    
    # 1. Researcher Phase
    try:
        # researcher agent internally manages its 90s budget for fetching, but we enforce a global orchestrator timeout too
        corpus = await asyncio.wait_for(run_research(name, context), timeout=TIMEOUT_RESEARCHER + 5.0)
        _add_event(job_id, "researcher", "complete", sources_found=len(corpus.sources))
    except (asyncio.TimeoutError, Exception) as e:
        logger.exception(f"Researcher failed: {repr(e)}")
        _add_event(job_id, "researcher", "failed", message=repr(e))
        partial_failure = True
        return # Cannot continue without corpus

    _add_event(job_id, "extractor", "running", message="Extracting structured profile data from sources...")
    
    # 2. Extractor Phase
    try:
        profile = await asyncio.wait_for(run_extraction(corpus, name, context), timeout=TIMEOUT_EXTRACTOR)
        _add_event(job_id, "extractor", "complete")
    except (asyncio.TimeoutError, Exception) as e:
        logger.exception(f"Extractor failed: {repr(e)}")
        _add_event(job_id, "extractor", "failed", message=repr(e))
        partial_failure = True
        # If extraction fails, we still want to return a partial job status
        _add_event(job_id, "complete", "partial_complete", message="Profile extraction failed.", profile=None)
        return
        
    _add_event(job_id, "validator", "running", message="Cross-referencing timeline and conflict data...")

    # 3. Validator Phase
    try:
        profile = await asyncio.wait_for(asyncio.to_thread(run_validation, profile), timeout=TIMEOUT_VALIDATOR)
        _add_event(job_id, "validator", "complete")
    except (asyncio.TimeoutError, Exception) as e:
        logger.exception(f"Validator failed: {repr(e)}")
        _add_event(job_id, "validator", "failed", message=repr(e))
        partial_failure = True
        # Profile is still mostly valid, just unvalidated
        
    # 4. Generate Image Phase (DALL-E 3)
    if profile:
        _add_event(job_id, "image_gen", "running", message="Generating professional portrait via DALL-E 3...")
        try:
            kwargs = {
                "api_key": os.environ.get("OPENAI_API_KEY", "dummy"),
                "max_retries": 3,
                "base_url": "https://api.openai.com/v1"
            }
            
            client = AsyncOpenAI(**kwargs)
            prompt = (
                f"A highly polished, ultra-realistic corporate portrait of {profile.name}, "
                f"who is the {profile.basic_details.role} at {profile.basic_details.organization}. "
                "Clean white background, modern enterprise aesthetics, sharp focus, professional lighting, "
                "hyper-realistic photography."
            )
            response = await client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                n=1,
            )
            profile.profile_image_url = response.data[0].url
            _add_event(job_id, "image_gen", "complete")
        except Exception as e:
            logger.warning(f"DALL-E 3 unavailable (Tier limits or safety filters). Falling back to dynamic avatar.")
            import urllib.parse
            encoded_name = urllib.parse.quote(profile.name)
            profile.profile_image_url = f"https://ui-avatars.com/api/?name={encoded_name}&background=0a2540&color=fff&size=512&font-size=0.33"
            _add_event(job_id, "image_gen", "complete", message="Profile avatar finalized.")
        
        
    # Finalize
    final_status = "partial_complete" if partial_failure else "complete"
    # Dump the model to a dict for the JSON response
    profile_data = profile.model_dump(mode='json') if profile else None
    
    JOB_STORE[job_id]["partial"] = partial_failure
    _add_event(job_id, "complete", final_status, profile=profile_data)
