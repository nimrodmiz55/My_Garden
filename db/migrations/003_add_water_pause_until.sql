-- Run once in Supabase Dashboard → SQL Editor
-- Adds an optional "watering pause" date. When set to a future date, the plant
-- is considered NOT thirsty until that date (used after an over-watering checkup).
ALTER TABLE plants ADD COLUMN IF NOT EXISTS water_pause_until DATE;
