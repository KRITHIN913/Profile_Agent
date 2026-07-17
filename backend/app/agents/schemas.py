"""
Diligencify Profile Builder — Internal Agent Schemas

These schemas define the data structures passed between internal components
(e.g., from the retrieval layer to the researcher agent).
"""

from pydantic import BaseModel, Field
from typing import Literal

class ExtractedSource(BaseModel):
    """A single processed source that passed disambiguation."""
    url: str
    title: str = Field(default="Unknown Title")
    domain: str
    extracted_text: str
    retrieved_at: str
    disambiguation_score: float
    credibility_tier: Literal["primary", "reputable_media", "other"]
    accessible: bool = True
    exclusion_note: str | None = None

class ResearchCorpus(BaseModel):
    """The complete verified dataset returned by the Researcher phase."""
    sources: list[ExtractedSource] = Field(default_factory=list)
    excluded_sources: list[ExtractedSource] = Field(
        default_factory=list,
        description="Sources that failed disambiguation or were inaccessible (e.g. paywalled)."
    )

class DisambiguationScore(BaseModel):
    """LLM output schema for source disambiguation."""
    score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence (0-1) that the content refers to the exact person in context."
    )
    reasoning: str = Field(
        ...,
        description="Brief explanation of why the score was assigned."
    )

class SearchQueryBatch(BaseModel):
    """LLM output schema for search query generation."""
    queries: list[str] = Field(
        ...,
        description="List of diversified search queries with context anchors appended."
    )
