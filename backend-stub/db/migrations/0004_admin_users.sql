-- 0004_admin_users.sql
-- Add password_hash to users so middleware/admin-auth.js can validate logins.
-- Existing rows get NULL password_hash; they cannot log in until bootstrapped.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Optional helpful index for case-insensitive lookups (citext already does this,
-- but explicit is cheap and survives a future column-type change).
CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (lower(email));
