-- Migration: add affected_population to disasters
ALTER TABLE disasters
ADD COLUMN affected_population INTEGER DEFAULT NULL;
