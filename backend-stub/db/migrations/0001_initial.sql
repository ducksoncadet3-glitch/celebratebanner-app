-- 0001_initial.sql
-- Initial schema. Equivalent to backend-stub/db/schema.sql but the migrations
-- runner is the source of truth going forward; new changes ship as 0002+ files.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE,
  display_name    TEXT,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_email  CITEXT,
  template_id     TEXT NOT NULL,
  arrangement     TEXT NOT NULL DEFAULT 'classic',
  render_type     TEXT NOT NULL DEFAULT 'standard',
  status          TEXT NOT NULL DEFAULT 'pending',
  render_input    JSONB NOT NULL DEFAULT '{}'::jsonb,
  rev             BIGINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  ready_at        TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  failure_reason  TEXT
);
CREATE INDEX IF NOT EXISTS projects_status_idx     ON projects (status);
CREATE INDEX IF NOT EXISTS projects_email_idx      ON projects (customer_email);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at DESC);

CREATE TABLE IF NOT EXISTS uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  s3_bucket       TEXT NOT NULL,
  s3_key          TEXT NOT NULL,
  asset_url       TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  bytes           BIGINT NOT NULL,
  sha256          TEXT NOT NULL,
  width           INTEGER,
  height          INTEGER,
  dpi             INTEGER,
  -- Optimized variant URLs (filled by image-optimizer.js)
  thumb_url       TEXT,
  medium_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, sha256)
);
CREATE INDEX IF NOT EXISTS uploads_project_idx ON uploads (project_id);

CREATE TABLE IF NOT EXISTS renders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  queue_job_id    TEXT,
  status          TEXT NOT NULL DEFAULT 'queued',
  progress        SMALLINT NOT NULL DEFAULT 0,
  png_key         TEXT,
  jpeg_key        TEXT,
  mockup_key      TEXT,
  video_key       TEXT,
  dimensions_w    INTEGER,
  dimensions_h    INTEGER,
  dpi             INTEGER,
  enqueued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  duration_ms     INTEGER,
  error_message   TEXT,
  attempts        SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS renders_project_idx ON renders (project_id);
CREATE INDEX IF NOT EXISTS renders_status_idx  ON renders (status);

CREATE TABLE IF NOT EXISTS payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            TEXT REFERENCES projects(id) ON DELETE SET NULL,
  stripe_session_id     TEXT UNIQUE,
  stripe_payment_intent TEXT UNIQUE,
  amount_total_cents    BIGINT NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'usd',
  product_ids           TEXT[] NOT NULL DEFAULT '{}',
  customer_email        CITEXT,
  shipping_address      JSONB,
  refunded_amount_cents BIGINT,
  status                TEXT NOT NULL DEFAULT 'succeeded',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payments_project_idx ON payments (project_id);
CREATE INDEX IF NOT EXISTS payments_email_idx   ON payments (customer_email);

CREATE TABLE IF NOT EXISTS download_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type      TEXT NOT NULL,
  s3_key          TEXT NOT NULL,
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  used_count      INTEGER NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMPTZ,
  last_ip         INET,
  last_ua         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS download_tokens_project_idx ON download_tokens (project_id);
CREATE INDEX IF NOT EXISTS download_tokens_expires_idx ON download_tokens (expires_at);

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS projects_touch_updated_at ON projects;
CREATE TRIGGER projects_touch_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
