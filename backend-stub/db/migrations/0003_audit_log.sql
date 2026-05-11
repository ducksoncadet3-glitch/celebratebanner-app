-- 0003_audit_log.sql
-- Append-only audit log for sensitive operations: refunds, manual re-renders,
-- token revocations, admin role changes. The admin dashboard exposes this for
-- compliance + incident response.

CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL PRIMARY KEY,
  actor_kind      TEXT NOT NULL,                       -- 'system' | 'admin' | 'webhook'
  actor_id        TEXT,                                -- admin user id, stripe event id, etc.
  action          TEXT NOT NULL,                       -- e.g. 'project.rerender', 'payment.refund'
  subject_kind    TEXT NOT NULL,                       -- 'project' | 'payment' | 'render' | 'user'
  subject_id      TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip              INET,
  ua              TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_log_subject_idx ON audit_log (subject_kind, subject_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx  ON audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON audit_log (created_at DESC);
