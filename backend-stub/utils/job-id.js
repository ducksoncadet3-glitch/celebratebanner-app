'use strict';

/**
 * BullMQ custom job id normalisation. Dependency-free on purpose: the pre-deploy test
 * suite runs with `node --test` and no npm install, so this must import nothing.
 *
 * BullMQ uses ":" as its Redis key separator and REJECTS a custom job id containing one
 * ("Custom Id cannot contain :", bullmq/classes/job.js). Callers naturally build keys like
 * `paid:<stripe_session_id>`, and that threw inside queue.add — which, from the Stripe
 * webhook, meant every paid order failed to enqueue: payment captured, no job, no render,
 * no download email, and Stripe retrying a call that could never succeed.
 *
 * Normalising centrally means no call site can reintroduce it. The mapping is 1:1, so
 * dedupe semantics (same session ⇒ same job id) are unchanged.
 */
function toJobId(dedupeKey) {
  if (dedupeKey === undefined || dedupeKey === null) return undefined;
  return String(dedupeKey).replace(/:/g, '-');
}

module.exports = { toJobId };
