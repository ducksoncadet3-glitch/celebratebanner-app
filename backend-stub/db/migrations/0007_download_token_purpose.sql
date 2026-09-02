-- Why a download token exists, so the two delivery channels can coexist.
--
-- A ready-made buyer must be able to download from BOTH the success page and the delivery
-- email. Those are two different tokens for the same artwork: the token string is never
-- stored (only its hash), so the emailed token can never be re-derived to hand back to the
-- page. Without a way to tell the two apart, giving the page a token either meant minting an
-- unbounded row per page refresh, or deleting the customer's emailed link.
--
--   'delivery'   issued once by the webhook, emailed, 7-day TTL. Never touched by the page.
--   'self_serve' issued for the success page, short TTL, at most ONE live row per project:
--                a refresh replaces its own previous row and nothing else.
--
-- Refund still revokes EVERY row for the project (services/tokens revokeProjectTokens), so
-- this widens no access. Existing rows are 'delivery', which is what they are.
ALTER TABLE download_tokens
  ADD COLUMN IF NOT EXISTS purpose TEXT NOT NULL DEFAULT 'delivery';

ALTER TABLE download_tokens
  DROP CONSTRAINT IF EXISTS download_tokens_purpose_check;
ALTER TABLE download_tokens
  ADD CONSTRAINT download_tokens_purpose_check CHECK (purpose IN ('delivery', 'self_serve'));

CREATE INDEX IF NOT EXISTS download_tokens_project_purpose_idx
  ON download_tokens (project_id, purpose);
