-- 0002_webhook_events.sql
-- Stripe webhook idempotency table. Every received event is upserted by
-- stripe_event_id BEFORE processing — if we've already seen it, we return
-- 200 without re-running side effects. Prevents double-renders, double-emails,
-- and double-refunds when Stripe retries deliveries.

CREATE TABLE IF NOT EXISTS webhook_events (
  stripe_event_id  TEXT PRIMARY KEY,
  type             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'processing',  -- processing|ok|failed
  payload          JSONB NOT NULL,
  received_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at     TIMESTAMPTZ,
  error_message    TEXT,
  attempts         SMALLINT NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS webhook_events_received_idx ON webhook_events (received_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx   ON webhook_events (status);
