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
 * Try to claim an event for processing. Returns:
 *   { firstSeen: true }   — caller proceeds to process it
 *   { firstSeen: false, status: 'ok' | 'processing' | 'failed' }
 *     — already seen; caller short-circuits with 200 and skips work
 */
async function claimEvent(event) {
  const insert = await query(
    `INSERT INTO webhook_events (stripe_event_id, type, status, payload)
     VALUES ($1, $2, 'processing', $3::jsonb)
     ON CONFLICT (stripe_event_id) DO NOTHING
     RETURNING stripe_event_id`,
    [event.id, event.type, JSON.stringify(event)],
  );
  if (insert.rowCount === 1) return { firstSeen: true };
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
