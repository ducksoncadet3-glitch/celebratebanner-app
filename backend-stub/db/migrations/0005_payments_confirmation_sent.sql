-- 0005_payments_confirmation_sent.sql
-- Idempotency anchor for the order-confirmation email. One confirmation per paid
-- session: the send is claimed by atomically flipping this column from NULL to NOW()
-- on the authoritative payments row (keyed by the UNIQUE stripe_session_id). Repeat
-- and concurrent requests find it non-NULL and send nothing; a transient transport
-- failure resets it to NULL so a later retry can re-send.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMPTZ;
