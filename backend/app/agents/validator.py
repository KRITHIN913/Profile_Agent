"""
Diligencify Profile Builder — Validator Agent

Runs logic and semantic validation on the extracted profile.
Specifically handles cross-referencing values to distinguish genuine conflicts
from timeline updates (e.g., net worth variations over time).
"""

import logging
import re
from datetime import datetime

from app.models.profile import DiligenceProfile, NetWorth

logger = logging.getLogger(__name__)

def parse_year(date_str: str) -> int | None:
    """Attempts to extract a 4-digit year from a string."""
    if not date_str or date_str == "Not publicly available":
        return None
    match = re.search(r'\b(19|20)\d{2}\b', date_str)
    if match:
        return int(match.group(0))
    return None

def resolve_net_worth_conflicts(net_worth: NetWorth):
    """
    Distinguishes real conflicts from timeline updates.
    A genuine conflict is when values contradict and the difference 
    isn't explained by differing as_of_date values.
    """
    # If the LLM already marked it conflicting, we verify it.
    if not net_worth.is_conflicting:
        return

    # If the LLM left a conflict note, let's parse if it looks like a timeline
    note = net_worth.conflict_note or ""
    
    # Extremely basic heuristic for the scaffold: 
    # If we see different years explicitly mentioned in the note, it's a timeline.
    years_found = set()
    for match in re.finditer(r'\b(19|20)\d{2}\b', note):
        years_found.add(int(match.group(0)))
        
    if len(years_found) > 1:
        # It's a timeline update, not a genuine conflict
        net_worth.is_conflicting = False
        net_worth.conflict_note = None
    else:
        # Genuine conflict. Enforce the exact format required.
        # Format: "Conflicting data: [Source A] states X, [Source B] states Y."
        if not note.startswith("Conflicting data:"):
            # If the LLM didn't format it right, we format it generically.
            # In a full implementation, we'd extract the exact numbers and sources.
            net_worth.conflict_note = f"Conflicting data: Multiple sources provide conflicting non-timeline data. Original note: {note}"

def run_validation(profile: DiligenceProfile) -> DiligenceProfile:
    """
    Cross-references fields and ensures semantic consistency.
    Modifies the profile in-place and returns it.
    """
    logger.info("Running Validator Agent...")

    # 1. Net Worth conflict resolution
    resolve_net_worth_conflicts(profile.net_worth)

    # 2. General cleanup (e.g. ensuring 'Not publicly available' is strictly adhered to for lists)
    # The Pydantic defaults handle most of this, but we can do semantic checks here.
    
    return profile
