-- Migration: add alert_metadata column to alerts table
-- Created: 2025-10-20 05:30:00

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS alert_metadata JSONB;

-- Migrate existing metadata to alert_metadata if needed
UPDATE alerts SET alert_metadata = metadata WHERE alert_metadata IS NULL AND metadata IS NOT NULL;
