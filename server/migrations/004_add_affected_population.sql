-- Migration: add affected_population to disasters
ALTER TABLE disasters
ADD COLUMN IF NOT EXISTS affected_population INTEGER DEFAULT NULL;
