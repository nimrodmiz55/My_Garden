-- Run once in Supabase Dashboard → SQL Editor
ALTER TABLE plants ADD COLUMN IF NOT EXISTS owner_email TEXT;
