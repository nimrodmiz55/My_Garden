-- Run this once in the Supabase Dashboard → SQL Editor
-- Tracks successful daily notification runs to prevent duplicate emails.

CREATE TABLE IF NOT EXISTS notification_runs (
  run_date   DATE        PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service role has full access (same pattern as plants table).
ALTER TABLE notification_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access"
  ON notification_runs FOR ALL
  USING (true)
  WITH CHECK (true);
