import asyncio
import uuid
import logging
import json
from datetime import datetime
from typing import Dict, Any, Optional

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
        
    # Finalize
    final_status = "partial_complete" if partial_failure else "complete"
    # Dump the model to a dict for the JSON response
    profile_data = profile.model_dump(mode='json') if profile else None
    
    JOB_STORE[job_id]["partial"] = partial_failure
    _add_event(job_id, "complete", final_status, profile=profile_data)
