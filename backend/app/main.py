import asyncio
import time
from typing import Optional
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

load_dotenv()

from app.services.orchestrator import create_job, run_pipeline, get_job_events_generator, JOB_STORE

app = FastAPI(title="Diligencify Profile Builder API")

# Configure CORS for Next.js dev origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Simple In-Memory Rate Limiter ---
# Limits to 5 requests per IP per 10 minutes
RATE_LIMIT_DURATION = 600
MAX_REQUESTS = 5
IP_STORE = {}

def check_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Initialize or clean up old requests
    if client_ip not in IP_STORE:
        IP_STORE[client_ip] = []
        
    # Keep only requests within the last RATE_LIMIT_DURATION
    IP_STORE[client_ip] = [
        req_time for req_time in IP_STORE[client_ip] 
        if current_time - req_time < RATE_LIMIT_DURATION
    ]
    
    if len(IP_STORE[client_ip]) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
        
    IP_STORE[client_ip].append(current_time)

# --- Models ---

class GenerateRequest(BaseModel):
    name: str
    context: dict = {}

# --- Endpoints ---

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/profile/generate")
async def generate_profile(req: GenerateRequest, request: Request, background_tasks: BackgroundTasks):
    """
    Creates a new job, starts the pipeline in the background, 
    and returns the job_id immediately.
    """
    check_rate_limit(request)
    
    job_id = create_job(req.name, req.context)
    
    # Launch pipeline as background task
    background_tasks.add_task(run_pipeline, job_id, req.name, req.context)
    
    return {"job_id": job_id}

@app.get("/api/profile/stream/{job_id}")
async def stream_profile(job_id: str, request: Request, lastEventId: int = 0):
    """
    Streams events as the pipeline progresses using Server-Sent Events.
    Uses sse-starlette to handle the response formatting.
    If disconnected, can resume by passing lastEventId (or we just stream from index 0 which 
    the generator currently handles cleanly by tracking index, but here we can pass it).
    """
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # The generator will yield historical events first, then block and wait for new ones
    generator = get_job_events_generator(job_id, start_idx=lastEventId)
    return EventSourceResponse(generator)

@app.get("/api/profile/status/{job_id}")
async def get_profile_status(job_id: str):
    """
    Returns a JSON snapshot of the current job state.
    Allows frontend to poll or recover if SSE drops entirely.
    """
    if job_id not in JOB_STORE:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job = JOB_STORE[job_id]
    
    return {
        "job_id": job["job_id"],
        "phase": job["phase"],
        "status": job["status"],
        "partial": job["partial"],
        "profile": job.get("profile") # None if not yet complete
    }
