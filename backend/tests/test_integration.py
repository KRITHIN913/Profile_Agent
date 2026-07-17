import asyncio
import pytest
from unittest.mock import patch, AsyncMock

try:
    from fastapi.testclient import TestClient
    from app.main import app
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

# We skip the test in environments where FastAPI could not be installed (e.g. MSYS2 sandbox)
@pytest.mark.skipif(not HAS_FASTAPI, reason="FastAPI is not installed in this environment.")
@patch("app.main.run_pipeline")
def test_generate_and_poll_status(mock_run_pipeline):
    """
    Integration test that hits /generate, polls /status, and asserts 
    the final shape of the profile matches the schema.
    """
    client = TestClient(app)
    
    # 1. Mock the background pipeline execution
    # We want it to instantly update the JOB_STORE when it's called
    async def fake_pipeline(job_id, name, context):
        from app.services.orchestrator import _add_event, JOB_STORE
        
        # Simulate researcher
        _add_event(job_id, "researcher", "running")
        _add_event(job_id, "researcher", "complete")
        
        # Simulate extractor
        _add_event(job_id, "extractor", "running")
        _add_event(job_id, "extractor", "complete")
        
        # Simulate validator & completion
        _add_event(job_id, "validator", "running")
        _add_event(job_id, "validator", "complete")
        
        # Fake profile matching the schema
        fake_profile = {
            "name": name,
            "query_context": context,
            "executive_summary": "Test summary",
            "basic_details": {"role": "CEO", "organization": "TestOrg", "location": "NY", "age_range": "40s"},
            "net_worth": {
                "value": "1.0", 
                "currency": "USD", 
                "as_of_date": "2024", 
                "confidence": "high", 
                "is_conflicting": False, 
                "conflict_note": None, 
                "sources": []
            },
            "career_timeline": [],
            "education": [],
            "philanthropy": [],
            "affiliations": [],
            "concerns": [],
            "sources_master_list": []
        }
        _add_event(job_id, "complete", "complete", profile=fake_profile)

    mock_run_pipeline.side_effect = fake_pipeline
    
    # 2. Hit /generate
    req_body = {
        "name": "John Doe",
        "context": {"employer": "TestOrg"}
    }
    response = client.post("/api/profile/generate", json=req_body)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    job_id = data["job_id"]
    
    # 3. Poll /status (in a real scenario we'd sleep and loop, but our mock runs instantly 
    # because FastAPI BackgroundTasks executes it synchronously in TestClient context sometimes, 
    # or we might need to yield to event loop. TestClient actually awaits background tasks.)
    
    status_response = client.get(f"/api/profile/status/{job_id}")
    assert status_response.status_code == 200
    status_data = status_response.json()
    
    assert status_data["job_id"] == job_id
    assert status_data["phase"] == "complete"
    assert status_data["status"] == "complete"
    assert status_data["partial"] is False
    
    profile = status_data["profile"]
    assert profile is not None
    assert profile["name"] == "John Doe"
    assert profile["basic_details"]["organization"] == "TestOrg"
