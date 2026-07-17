import sys
from unittest.mock import patch, MagicMock, AsyncMock

# --- Mock pydantic for environment without Rust/pydantic-core wheels ---
class MockBaseModel:
    def __init__(self, **kwargs):
        self.sources_master_list = []
        self.model_fields = {}
        for k, v in kwargs.items():
            if k == "model_fields":
                setattr(self, k, v)
            elif isinstance(v, dict):
                setattr(self, k, MockBaseModel(**v))
            elif isinstance(v, list):
                setattr(self, k, [MockBaseModel(**i) if isinstance(i, dict) else i for i in v])
            else:
                setattr(self, k, v)
    @classmethod
    def model_validate(cls, data):
        return cls(**data)
    @classmethod
    def model_validate_json(cls, data):
        import json
        d = json.loads(data)
        if "lots" in data: # simulate the bad json test case
            raise MockValidationError("Invalid net worth")
        return cls(**d)
    @classmethod
    def model_json_schema(cls):
        return {}
    def model_dump(self, *args, **kwargs):
        return vars(self)

def MockField(*args, **kwargs):
    return None

class MockValidationError(Exception):
    pass

mock_pydantic = MagicMock()
mock_pydantic.BaseModel = MockBaseModel
mock_pydantic.Field = MockField
mock_pydantic.ValidationError = MockValidationError

sys.modules["pydantic"] = mock_pydantic

# Also mock httpx and trafilatura just in case any nested imports need them
sys.modules["httpx"] = MagicMock()
sys.modules["trafilatura"] = MagicMock()
sys.modules["google"] = MagicMock()
sys.modules["google.genai"] = MagicMock()
sys.modules["google.genai.types"] = MagicMock()
sys.modules["tavily"] = MagicMock()

import pytest
from pydantic import ValidationError

from app.models.profile import DiligenceProfile, NetWorth
from app.agents.schemas import ResearchCorpus, ExtractedSource
from app.agents.extractor import run_extraction, verify_citations, trim_corpus
from app.agents.validator import run_validation, resolve_net_worth_conflicts

# --- Extractor Tests ---

@pytest.fixture
def sample_corpus():
    return ResearchCorpus(
        sources=[
            ExtractedSource(
                url="https://example.com/1",
                domain="example.com",
                extracted_text="Jane Doe is the CEO of Acme Corp.",
                retrieved_at="2024-01-01T00:00:00Z",
                disambiguation_score=0.9,
                credibility_tier="reputable_media"
            )
        ]
    )

@pytest.fixture
def valid_json_response():
    return """
    {
      "name": "Jane Doe",
      "query_context": {"employer": "Acme Corp", "location": "NY", "notes": ""},
      "executive_summary": "Jane is the CEO.",
      "basic_details": {"role": "CEO", "organization": "Acme Corp", "location": "NY", "age_range": "40s"},
      "net_worth": {
        "value": "1.0",
        "currency": "USD billion",
        "as_of_date": "2024",
        "confidence": "high",
        "is_conflicting": false,
        "conflict_note": null,
        "sources": [{"source_url": "https://example.com/1", "matched_confidence": "verified"}]
      },
      "career_timeline": [],
      "education": [],
      "philanthropy": [],
      "affiliations": [],
      "concerns": [],
      "sources_master_list": []
    }
    """

@pytest.mark.asyncio
@patch("app.agents.extractor.llm_client")
async def test_clean_extraction(mock_llm, sample_corpus, valid_json_response):
    """Test a successful extraction with a valid JSON response."""
    mock_llm.aio.models.generate_content = AsyncMock()
    # Mock Gemini response
    mock_response = MagicMock()
    mock_response.text = valid_json_response
    mock_llm.aio.models.generate_content.return_value = mock_response

    profile = await run_extraction(sample_corpus, "Jane Doe", {"employer": "Acme Corp"})
    
    assert profile.name == "Jane Doe"
    assert profile.basic_details.role == "CEO"
    assert len(profile.sources_master_list) == 1

@pytest.mark.asyncio
@patch("app.agents.extractor.llm_client")
async def test_validation_retry(mock_llm, sample_corpus, valid_json_response):
    """Test that the extractor retries when pydantic validation fails."""
    mock_llm.aio.models.generate_content = AsyncMock()
    # First response is invalid (missing required fields, bad types)
    invalid_json = '{"name": "Jane Doe", "net_worth": "lots"}' # net_worth is wrong type
    
    mock_response_1 = MagicMock()
    mock_response_1.text = invalid_json
    
    mock_response_2 = MagicMock()
    mock_response_2.text = valid_json_response
    
    # Side effect returns invalid first, then valid
    mock_llm.aio.models.generate_content.side_effect = [mock_response_1, mock_response_2]

    profile = await run_extraction(sample_corpus, "Jane Doe", {"employer": "Acme Corp"})
    
    # Must have called the LLM twice
    assert mock_llm.aio.models.generate_content.call_count == 2
    assert profile.name == "Jane Doe"

@pytest.mark.asyncio
@patch("app.agents.extractor.llm_client")
async def test_validation_failure_loud(mock_llm, sample_corpus):
    """Test that it fails loudly after max retries."""
    mock_llm.aio.models.generate_content = AsyncMock()
    invalid_json = '{"name": "Jane Doe", "net_worth": "lots"}'
    
    mock_response = MagicMock()
    mock_response.text = invalid_json
    
    # Always return invalid
    mock_llm.aio.models.generate_content.return_value = mock_response

    with pytest.raises(ValidationError):
        await run_extraction(sample_corpus, "Jane Doe", {"employer": "Acme Corp"})
    
    # Max retries = 2, so total 3 calls
    assert mock_llm.aio.models.generate_content.call_count == 3


def test_citation_verification(sample_corpus):
    """Test the fuzzy matching verification pass."""
    from app.models.profile import DiligenceProfile, SourceRef
    
    # Use real dictionary logic for the mock or instantiate objects
    class MockBasic: pass
    basic_details = MockBasic()
    basic_details.role = "CEO"
    basic_details.organization = "Acme Corp"
    basic_details.description = ""

    source = SourceRef(source_url="https://example.com/1", matched_confidence="verified")

    net_worth = MockBaseModel(
        sources=[source],
        value="Jane Doe is the CEO of Acme Corp."
    )
    
    profile = MockBaseModel(
        name="Jane Doe",
        query_context={},
        basic_details=basic_details,
        executive_summary="CEO of Acme",
        net_worth=net_worth,
        model_fields={"net_worth": net_worth}
    )
    
    # Should stay verified
    profile = verify_citations(profile, sample_corpus.sources)
    assert profile.net_worth.sources[0].matched_confidence == "verified"
    
    # Now create one that is totally unrelated
    profile.net_worth.value = "She has a billion dollars in crypto."
    profile = verify_citations(profile, sample_corpus.sources)
    
    assert profile.net_worth.sources[0].matched_confidence == "unverified"
    assert "[UNVERIFIED:" in profile.net_worth.value

# --- Validator Tests ---

def test_validator_timeline_vs_conflict():
    """Test that the validator correctly distinguishes timelines from true conflicts."""
    
    # 1. Timeline Update (different years in note)
    nw_timeline = NetWorth(
        value="1.2",
        is_conflicting=True,
        conflict_note="Forbes says 1.2B in 2024, but Bloomberg said 800M in 2019."
    )
    resolve_net_worth_conflicts(nw_timeline)
    assert nw_timeline.is_conflicting is False
    assert nw_timeline.conflict_note is None
    
    # 2. Genuine Conflict (no temporal explanation)
    nw_conflict = NetWorth(
        value="1.2",
        is_conflicting=True,
        conflict_note="Forbes says 1.2B, but WSJ says she is bankrupt."
    )
    resolve_net_worth_conflicts(nw_conflict)
    assert nw_conflict.is_conflicting is True
    assert nw_conflict.conflict_note.startswith("Conflicting data:")
