-- ============================================================
-- Migration: Add password_hash to users table
-- Run this in: Supabase → SQL Editor → New Query
-- ============================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text;

-- ✅ Done. Existing rows will have NULL (no password), 
-- which is fine — they won't be able to log in until they
-- re-register or you build a password-reset flow.
