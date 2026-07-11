-- Run this once in the Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS plants (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname               TEXT        NOT NULL,
  last_watered_date      DATE        NOT NULL,
  species                TEXT        NOT NULL,
  size                   TEXT        NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  watering_interval_days INTEGER     NOT NULL,
  image_url              TEXT,
  owner_email            TEXT,
  water_pause_until      DATE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- All reads/writes go through the Express server using the service role key,
-- so RLS is enabled but access is unrestricted at this stage.
-- Tighten policies when you add user authentication.
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role full access"
  ON plants FOR ALL
  USING (true)
  WITH CHECK (true);
