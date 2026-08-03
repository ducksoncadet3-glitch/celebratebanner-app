/**
 * services/contracts.ts — SERVICE BOUNDARY CONTRACTS (TYPES/INTERFACES ONLY).
 *
 * ARCHITECTURE-ONLY MILESTONE. This file contains NO runtime logic, NO function
 * bodies that execute work, NO external AI/API calls, and NO imports. It declares
 * the interfaces the pipeline is built from. Nothing here runs.
 *
 * See ../docs/API_INTERFACES.md and ../docs/ARCHITECTURE.md.
 */

// ── Versioned reference ────────────────────────────────────────────────────
export interface IdVersion {
  id: string;
  version: string; // SemVer
}

// ── Domain models (shapes mirror the JSON schemas) ─────────────────────────
export interface GoldStandard {
  id: string;
  version: string;
  orientation: "landscape" | "portrait";
  print: PrintContract;
  // …full shape defined by gold-standards/**/schema.json
}

export interface PrintContract {
  widthIn: number;
  heightIn: number;
  dpi: 300;
  bleedIn: number;
  safeMarginIn: number;
  colorMode: "CMYK";
  formats: Array<"pdf" | "jpg">;
}

export interface Adapter {
  id: string;
  version: string;
  displayName: string;
  goldStandard: IdVersion; // binding
  // …full shape defined by adapters/**/schema.json
}

export interface JobInputs {
  product: string; // adapter id
  idempotencyKey: string;
  inputs: Record<string, unknown>; // validated against the adapter's fields
  photos: PhotoRef[];
}

export interface PhotoRef {
  role: "hero" | "supporting";
  ref: string; // e.g. upload://…
  sha256: string;
}

export interface NormalizedAssets {
  heroCutoutRef?: string;
  slotRefs: string[];
  colorSpace: "sRGB" | "CMYK-safe";
}

export interface PromptBundle {
  promptBundleId: string;
  template: IdVersion;
  goldStandard: IdVersion;
  adapter: IdVersion;
  inputsHash: string;
  seed: number;
  text: { positive: string; negative: string };
}

export interface Candidate {
  candidateRef: string;
  manifestDraft: Record<string, unknown>; // validated against outputs/manifest.schema.json
}

export interface QaVerdict {
  passed: boolean;
  wowScore: number;
  gates: Array<{ gate: string; passed: boolean; score?: number; reasons?: string[] }>;
}

export type ReviewState =
  | "PENDING" | "IN_REVIEW" | "APPROVED"
  | "CHANGES_REQUESTED" | "REJECTED" | "REGENERATING" | "FALLBACK";

export interface ReviewRecord {
  reviewRecordId: string;
  jobId: string;
  candidateRef: string;
  qa: QaVerdict;
  state: ReviewState;
  reviewer?: string;
  notes?: string;
}

export type ReviewDecision =
  | { kind: "approve" }
  | { kind: "changes"; notes: string }
  | { kind: "reject"; reason: string };

export interface Artifact {
  ref?: string;
  kind: "candidate" | "webPreview" | "printJpg" | "printPdf" | "manifest";
  bytesRef: string;
}
export type Ref = string;

export type ArtworkEvent =
  | { type: "artwork.approved"; jobId: string; outputs: Record<string, string>; manifest: string }
  | { type: "artwork.failed"; jobId: string; reason: string; fellBackToBrowserRenderer: boolean };

// ── Service interfaces (boundaries only — no implementations) ──────────────
export interface GoldStandardLoader { resolve(id: string, version: string): Promise<GoldStandard>; }
export interface AdapterLoader      { resolve(id: string, version: string): Promise<Adapter>; }
export interface AssetService       { normalize(photos: PhotoRef[]): Promise<NormalizedAssets>; }
export interface PromptBuilder      { build(gs: GoldStandard, ad: Adapter, inputs: JobInputs): Promise<PromptBundle>; }
export interface QAService          { evaluate(c: Candidate): Promise<QaVerdict>; }
export interface ReviewService {
  submit(c: Candidate, v: QaVerdict): Promise<ReviewRecord>;
  decide(reviewRecordId: string, d: ReviewDecision): Promise<ReviewRecord>;
}
export interface StorageService     { put(a: Artifact): Promise<Ref>; get(ref: Ref): Promise<Artifact>; }
export interface CallbackService    { emit(event: ArtworkEvent): Promise<void>; }

/** Drives the pipeline state machine; owns retries/timeouts/fallback. */
export interface Orchestrator {
  submit(job: JobInputs): Promise<{ jobId: string }>;
  status(jobId: string): Promise<{ jobId: string; state: ReviewState | "RECEIVED" | "DELIVERED" | "FAILED" }>;
  cancel(jobId: string): Promise<void>;
}
