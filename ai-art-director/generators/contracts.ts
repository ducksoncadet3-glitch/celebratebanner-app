/**
 * generators/contracts.ts — GENERATOR BOUNDARY (TYPES/INTERFACES ONLY).
 *
 * ARCHITECTURE-ONLY MILESTONE. No implementations, no external AI/API calls, no
 * keys/SDKs, no runtime logic. Every backend — including the EXISTING browser
 * renderer used read-only as a fallback — implements the same interface so the
 * orchestrator stays backend-agnostic.
 *
 * See ../docs/API_INTERFACES.md §4 and ../docs/ARCHITECTURE.md §2.
 */

import type { PromptBundle, NormalizedAssets, Candidate } from "../services/contracts";

export type GeneratorBackend =
  | "browser-renderer" // existing Premium Cinematic canvas renderer — read-only fallback/baseline
  | "bg-removal"       // hero cutout
  | "scene"            // cinematic background / atmosphere
  | "compositor";      // deterministic 300 DPI assembly (geometry + text + print spec)

export interface Generator {
  readonly backend: GeneratorBackend;
  generate(bundle: PromptBundle, assets: NormalizedAssets): Promise<Candidate>;
}

/** Selects a backend per stage; falls back to `browser-renderer` on failure. */
export interface GeneratorClient {
  generate(bundle: PromptBundle, assets: NormalizedAssets): Promise<Candidate>;
  readonly backends: ReadonlyArray<GeneratorBackend>;
  readonly fallback: "browser-renderer";
}
