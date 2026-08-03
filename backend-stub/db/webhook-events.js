/**
 * Webhook event idempotency repository.
 *
 * Stripe retries deliveries for up to 3 days when we 5xx, and occasionally
 * delivers the same event twice even on success. We insert each event into
 * webhook_events keyed by stripe_event_id; a duplicate insert means we've
 * already processed it and can return 200 without side effects.
 */

const { query, one } = require('./index');

/**
 * A webhook handler that dies mid-flight (process killed, pod evicted) leaves its
 * row stuck in 'processing'. After this many seconds we consider such a row orphaned
 * and allow a Stripe retry to re-claim it. Must be comfortably longer than the worst-case
 * handler runtime so we never re-claim a row that's genuinely still being processed.
 */
const STALE_PROCESSING_SECONDS = 300; // 5 minutes

/**
 * Try to claim an event for processing. Returns:
 *   { firstSeen: true,  reclaimed: false } — brand-new event; caller processes it
 *   { firstSeen: true,  reclaimed: true  } — a prior 'failed' / orphaned-'processing'
 *                                            event we're retrying; caller re-processes it
 *   { firstSeen: false, status }           — already handled ('ok') or genuinely in
 *                                            flight (fresh 'processing'); caller 200s + skips
 *
 * Idempotency + retry safety: `ok` events (and fresh in-flight `processing` rows) always
 * short-circuit, so successful side effects never run twice. But `failed` events and
 * *orphaned* `processing` rows are re-claimed, so a transient failure (DB/queue blip) that
 * returned 500 gets legitimately re-processed when Stripe retries — instead of being
 * dedup-swallowed and leaving the order stuck. Downstream side effects are themselves
 * idempotent (payments upsert ON CONFLICT, render dedupeKey = session id), so re-processing
 * a partially-applied event converges safely.
 */
async function claimEvent(event) {
  const upsert = await query(
    `INSERT INTO webhook_events (stripe_event_id, type, status, payload)
     VALUES ($1, $2, 'processing', $3::jsonb)
     ON CONFLICT (stripe_event_id) DO UPDATE
       SET status        = 'processing',
           attempts      = webhook_events.attempts + 1,
           received_at   = NOW(),
           error_message = NULL
       WHERE webhook_events.status = 'failed'
          OR (webhook_events.status = 'processing'
              AND webhook_events.received_at < NOW() - make_interval(secs => $4))
     RETURNING (xmax = 0) AS inserted`,
    [event.id, event.type, JSON.stringify(event), STALE_PROCESSING_SECONDS],
  );

  // A row came back → we either inserted (new) or updated (re-claimed a failed/orphaned one).
  if (upsert.rowCount === 1) {
    return { firstSeen: true, reclaimed: !upsert.rows[0].inserted };
  }

  // No row → the conflict target existed but didn't qualify for re-claim:
  // it's already 'ok' or a fresh 'processing' still within the stale window.
  const row = await one(`SELECT status FROM webhook_events WHERE stripe_event_id = $1`, [event.id]);
  return { firstSeen: false, status: row?.status ?? 'unknown' };
}

async function markEventOk(eventId) {
  await query(
    `UPDATE webhook_events SET status = 'ok', processed_at = NOW() WHERE stripe_event_id = $1`,
    [eventId],
  );
}

async function markEventFailed(eventId, errorMessage) {
  await query(
    `UPDATE webhook_events
        SET status = 'failed',
            processed_at = NOW(),
            error_message = $1,
            attempts = attempts + 1
      WHERE stripe_event_id = $2`,
    [errorMessage?.slice(0, 500) || 'unknown', eventId],
  );
}

async function recent(limit = 100) {
  const { rows } = await query(
    `SELECT stripe_event_id, type, status, received_at, processed_at, error_message, attempts
       FROM webhook_events
   ORDER BY received_at DESC
      LIMIT $1`,
    [limit],
  );
  return rows;
}

module.exports = { claimEvent, markEventOk, markEventFailed, recent };
