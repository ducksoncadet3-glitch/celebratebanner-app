-- 0006_analytics_events.sql
-- Lightweight first-party campaign attribution.
--
-- One row per funnel event (product_view / checkout_started / purchase_completed) with the
-- campaign that brought the visitor. Deliberately NOT a general analytics platform: a single
-- append-only table the admin report aggregates.
--
-- Privacy: no card data, no email, no IP, no user agent, no fingerprint. `attribution_id` is
-- a random client-generated value used only to join a view to its checkout.
--
-- Idempotency: `dedupe_key` is UNIQUE. purchase_completed uses the Stripe session id, so a
-- redelivered webhook cannot create a second purchase row or double-count revenue.

CREATE TABLE IF NOT EXISTS analytics_events (
  id             BIGSERIAL PRIMARY KEY,
  event_type     TEXT        NOT NULL CHECK (event_type IN ('product_view','checkout_started','purchase_completed')),
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  product_slug   TEXT,
  product_mode   TEXT CHECK (product_mode IN ('personalized','ready-made')),

  utm_source     TEXT NOT NULL DEFAULT 'direct',
  utm_medium     TEXT NOT NULL DEFAULT 'direct',
  utm_campaign   TEXT NOT NULL DEFAULT 'unknown',
  utm_content    TEXT,

  attribution_id TEXT,
  project_id     TEXT,
  -- Stripe references. No card data is ever stored.
  session_ref    TEXT,
  amount_cents   BIGINT,
  currency       TEXT,

  -- NULL for events that need no de-duplication; UNIQUE when present.
  dedupe_key     TEXT UNIQUE
);

CREATE INDEX IF NOT EXISTS analytics_events_type_time_idx ON analytics_events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_source_idx    ON analytics_events (utm_source, utm_campaign);
CREATE INDEX IF NOT EXISTS analytics_events_product_idx   ON analytics_events (product_slug);
CREATE INDEX IF NOT EXISTS analytics_events_attr_idx      ON analytics_events (attribution_id);
