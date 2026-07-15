/**
 * queues/message-schemas.ts — ASYNC MESSAGE CONTRACTS (TYPES ONLY).
 *
 * ARCHITECTURE-ONLY MILESTONE. No broker, no consumers, no runtime logic. These
 * types define the shape of messages on each pipeline topic. One topic per stage;
 * the orchestrator moves jobs across them.
 *
 * See ../docs/API_INTERFACES.md §2 and ../docs/DATA_FLOW.md.
 */

import type { JobInputs, PromptBundle, QaVerdict } from "../services/contracts";

export type Topic =
  | "jobs.received"
  | "jobs.normalized"
  | "jobs.prompted"
  | "jobs.generated"
  | "jobs.qa"
  | "jobs.review"
  | "jobs.approved"
  | "jobs.failed"
  | "jobs.dlq";

export interface Envelope<T> {
  topic: Topic;
  jobId: string;
  attempt: number;          // for bounded retries (see docs/ERROR_HANDLING.md)
  idempotencyKey: string;
  payload: T;
  // enqueuedAt is stamped by the runtime broker, not in this milestone
}

export interface JobReceived   { job: JobInputs; }
export interface JobNormalized { assetRefs: string[]; heroCutoutRef?: string; }
export interface JobPrompted   { promptBundle: Pick<PromptBundle, "promptBundleId" | "seed">; }
export interface JobGenerated  { candidateRef: string; }
export interface JobQa         { verdict: QaVerdict; }
export interface JobReview     { reviewRecordId: string; }
export interface JobApproved   { outputs: Record<string, string>; manifestRef: string; }
export interface JobFailed     { reason: string; fellBackToBrowserRenderer: boolean; }
export interface JobDlq        { error: string; attempts: number; lastTopic: Topic; }

export type Message =
  | Envelope<JobReceived>
  | Envelope<JobNormalized>
  | Envelope<JobPrompted>
  | Envelope<JobGenerated>
  | Envelope<JobQa>
  | Envelope<JobReview>
  | Envelope<JobApproved>
  | Envelope<JobFailed>
  | Envelope<JobDlq>;
