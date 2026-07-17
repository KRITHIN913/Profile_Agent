/**
 * Diligencify Profile Builder — Shared Data Schema (TypeScript)
 *
 * This file is the canonical frontend type definition.
 * It mirrors the Pydantic models in /backend/app/models/profile.py.
 *
 * Design rules (same as backend):
 *  - Every field that has no public data will contain the literal string
 *    "Not publicly available". Treat this as a display sentinel.
 *  - `concerns` entries MUST have at least one SourceRef.
 */

// ─── Atomic building blocks ───────────────────────────────────────────────────

export interface SourceRef {
  /** Canonical URL — must exist in sources_master_list */
  source_url: string;
  /**
   * "verified"   = source explicitly states the claim
   * "unverified" = source implies or is consistent with the claim
   */
  matched_confidence: "verified" | "unverified";
}

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface QueryContext {
  employer: string;
  location: string;
  notes: string;
}

export interface BasicDetails {
  role: string;
  organization: string;
  location: string;
  age_range: string;
}

export interface NetWorth {
  value: string;
  currency: string;
  as_of_date: string;
  confidence: "high" | "medium" | "low";
  /** True when multiple credible sources report materially different figures */
  is_conflicting: boolean;
  /** Explanation of the conflict; present when is_conflicting is true */
  conflict_note: string | null;
  sources: SourceRef[];
}

export interface CareerEntry {
  title: string;
  organization: string;
  start_date: string;
  end_date: string;
  description: string;
  sources: SourceRef[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  year: string;
  sources: SourceRef[];
}

export interface PhilanthropyEntry {
  organization: string;
  role: string;
  notes: string;
  sources: SourceRef[];
}

export interface AffiliationEntry {
  entity: string;
  relationship_type: string;
  sources: SourceRef[];
}

/**
 * Adverse media, litigation, or regulatory flag.
 * MUST have at least one SourceRef — never rendered without a grounding source.
 */
export interface ConcernEntry {
  description: string;
  severity: "low" | "medium" | "high";
  sources: [SourceRef, ...SourceRef[]]; // Tuple ensures min-length 1 at the type level
}

export interface MasterSource {
  url: string;
  title: string;
  domain: string;
  /** ISO-8601 datetime string */
  retrieved_at: string;
  credibility_tier: "primary" | "reputable_media" | "other";
  /** False if the page returned a paywall, 404, or access error */
  accessible: boolean;
}

// ─── Root profile type ────────────────────────────────────────────────────────

/**
 * Canonical due-diligence profile for a named individual.
 *
 * Consumer note: treat the literal string "Not publicly available" as a
 * display sentinel for missing data. It is never null or undefined.
 */
export interface DiligenceProfile {
  /** Full name of the subject */
  name: string;
  query_context: QueryContext;

  /** High-level narrative paragraph */
  executive_summary: string;

  basic_details: BasicDetails;
  net_worth: NetWorth;
  career_timeline: CareerEntry[];
  education: EducationEntry[];
  philanthropy: PhilanthropyEntry[];
  affiliations: AffiliationEntry[];

  /**
   * Adverse media, litigation, and regulatory flags.
   * Empty array = no concerns found (not that the check was skipped).
   * Each entry is guaranteed to have at least one SourceRef.
   */
  concerns: ConcernEntry[];

  /** Master provenance list — all SourceRef.source_url values resolve here */
  sources_master_list: MasterSource[];
}

// ─── Helper / utility types ───────────────────────────────────────────────────

/** Severity levels for display logic */
export type SeverityLevel = ConcernEntry["severity"];

/** Confidence levels for net-worth and source-matching */
export type ConfidenceLevel = NetWorth["confidence"];

/** Credibility tiers for source display */
export type CredibilityTier = MasterSource["credibility_tier"];

/**
 * Partial profile used during streaming generation —
 * all top-level fields are optional until the full profile is finalised.
 */
export type PartialDiligenceProfile = Partial<DiligenceProfile> &
  Pick<DiligenceProfile, "name">;
