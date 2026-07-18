"""
Diligencify Profile Builder — Shared Data Schema (Pydantic v2)

This module defines the canonical data model for a due-diligence profile.
It is the single source of truth on the backend; the matching TypeScript
interface lives in /frontend/types/profile.ts.

Design rules:
  - Every field that has no public data MUST contain the literal string
    "Not publicly available". Fields must never be silently omitted or null.
  - The `concerns` list MUST only contain entries that have at least one
    SourceRef. AI must never fabricate concerns without a grounding source.
"""

from __future__ import annotations

from typing import Literal, List, Any
from pydantic import BaseModel, Field, field_validator


# ── Atomic building blocks ────────────────────────────────────────────────────


class SourceRef(BaseModel):
    """A lightweight pointer from a profile claim back to the master source list."""

    source_url: str = Field(..., description="Canonical URL from the master sources list")
    matched_confidence: Literal["verified", "unverified", "Not publicly available"] = Field(
        ...,
        description=(
            "'verified' = source explicitly states the claim; "
            "'unverified' = source implies or is consistent with the claim."
        ),
    )


# ── Sub-models ────────────────────────────────────────────────────────────────


class QueryContext(BaseModel):
    """Optional hints supplied by the analyst to disambiguate the subject."""

    employer: str = Field(default="Not publicly available")
    location: str = Field(default="Not publicly available")
    notes: str = Field(default="Not publicly available")


class BasicDetails(BaseModel):
    role: str = Field(default="Not publicly available")
    organization: str = Field(default="Not publicly available")
    location: str = Field(default="Not publicly available")
    age_range: str = Field(default="Not publicly available")


class NetWorth(BaseModel):
    value: str = Field(default="Not publicly available")
    currency: str = Field(default="Not publicly available")
    as_of_date: str = Field(default="Not publicly available")
    confidence: Literal["high", "medium", "low", "Not publicly available"] = Field(default="Not publicly available")
    is_conflicting: bool = Field(
        default=False,
        description="True when multiple credible sources report materially different figures.",
    )
    conflict_note: str | None = Field(
        default=None,
        description="Explanation of the conflict when is_conflicting is True.",
    )
    sources: list[SourceRef] = Field(default_factory=list)


class CareerEntry(BaseModel):
    title: str = Field(default="Not publicly available")
    organization: str = Field(default="Not publicly available")
    start_date: str = Field(default="Not publicly available")
    end_date: str = Field(default="Not publicly available")
    description: str = Field(default="Not publicly available")
    sources: list[SourceRef] = Field(default_factory=list)


class EducationEntry(BaseModel):
    institution: str = Field(default="Not publicly available")
    degree: str = Field(default="Not publicly available")
    year: str = Field(default="Not publicly available")
    sources: list[SourceRef] = Field(default_factory=list)


class PhilanthropyEntry(BaseModel):
    organization: str = Field(default="Not publicly available")
    role: str = Field(default="Not publicly available")
    notes: str = Field(default="Not publicly available")
    sources: list[SourceRef] = Field(default_factory=list)


class AffiliationEntry(BaseModel):
    entity: str = Field(default="Not publicly available")
    relationship_type: str = Field(default="Not publicly available")
    sources: list[SourceRef] = Field(default_factory=list)


class ConcernEntry(BaseModel):
    """
    Adverse media, litigation, or regulatory flag.

    IMPORTANT: This model MUST have at least one SourceRef.
    The generation layer is responsible for enforcing this invariant —
    never emit a concern without grounding it in a real source.
    """

    description: str
    severity: Literal["low", "medium", "high", "Not publicly available"]
    sources: list[SourceRef] = Field(
        ...,
        min_length=1,
        description="At least one source required for every concern entry.",
    )


class MasterSource(BaseModel):
    """Canonical source record; all SourceRef.source_url values must map here."""

    url: str
    title: str = Field(default="Not publicly available")
    domain: str = Field(default="Not publicly available")
    retrieved_at: str = Field(
        ..., description="ISO-8601 datetime string of retrieval."
    )
    credibility_tier: Literal["primary", "reputable_media", "other", "Not publicly available"] = Field(
        default="Not publicly available"
    )
    accessible: bool = Field(
        default=True,
        description="False if the page returned a paywall, 404, or access error.",
    )


# ── Root profile model ────────────────────────────────────────────────────────


class DiligenceProfile(BaseModel):
    """
    Canonical due-diligence profile for a named individual.

    Field-level defaults ensure every key is always present in output.
    Consuming code should treat the literal "Not publicly available"
    as a sentinel for missing data rather than checking for null/None.
    """

    # ── Identity ──────────────────────────────────────────────────────────────
    name: str = Field(..., description="Full name of the subject.")
    profile_image_url: str | None = Field(default=None, description="Generated avatar/portrait URL")
    query_context: QueryContext = Field(default_factory=QueryContext)

    # ── Narrative ─────────────────────────────────────────────────────────────
    executive_summary: str = Field(
        default="Not publicly available",
        description="A cohesive 2-3 paragraph professional biography synthesizing the subject's background, current roles, and overarching narrative."
    )

    # ── Structured sections ───────────────────────────────────────────────────
    basic_details: BasicDetails = Field(default_factory=BasicDetails)
    net_worth: NetWorth = Field(default_factory=NetWorth)
    career_timeline: list[CareerEntry] = Field(default_factory=list)
    education: list[EducationEntry] = Field(default_factory=list)
    philanthropy: list[PhilanthropyEntry] = Field(default_factory=list)
    affiliations: list[AffiliationEntry] = Field(default_factory=list)

    @field_validator("career_timeline", "education", "philanthropy", "affiliations", mode="after")
    @classmethod
    def filter_dummy_entries(cls, v: list[Any]) -> list[Any]:
        # Filter out entries where the primary fields are all 'Not publicly available'
        filtered = []
        for entry in v:
            # Dump the model to dict
            data = entry.model_dump()
            # Check if all string fields (excluding sources) are the default "Not publicly available"
            str_values = [val for key, val in data.items() if key != "sources" and isinstance(val, str)]
            if str_values and all(val == "Not publicly available" for val in str_values):
                continue
            filtered.append(entry)
        return filtered

    # ── Risk / adverse media ──────────────────────────────────────────────────
    concerns: list[ConcernEntry] = Field(
        default_factory=list,
        description=(
            "Adverse media, litigation, and regulatory flags. "
            "Each entry MUST have at least one SourceRef. "
            "An empty list means no concerns were found — not that the check was skipped."
        ),
    )

    # ── Source provenance ─────────────────────────────────────────────────────
    sources_master_list: list[MasterSource] = Field(default_factory=list)

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Jane Doe",
                "query_context": {
                    "employer": "Acme Capital",
                    "location": "New York, NY",
                    "notes": "Family office investor",
                },
                "executive_summary": "Jane Doe is a senior partner at Acme Capital...",
                "basic_details": {
                    "role": "Senior Partner",
                    "organization": "Acme Capital",
                    "location": "New York, NY",
                    "age_range": "50–55",
                },
                "net_worth": {
                    "value": "1.2",
                    "currency": "USD billion",
                    "as_of_date": "2024-01",
                    "confidence": "medium",
                    "is_conflicting": False,
                    "conflict_note": None,
                    "sources": [
                        {
                            "source_url": "https://example.com/article",
                            "matched_confidence": "verified",
                        }
                    ],
                },
                "career_timeline": [],
                "education": [],
                "philanthropy": [],
                "affiliations": [],
                "concerns": [],
                "sources_master_list": [],
            }
        }
    }
