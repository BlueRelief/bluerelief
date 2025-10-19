-- Migration: update event_time to iso8601 format with index
-- Created: 2025-10-19 10:07:20
-- Purpose: Add indexes and constraints for event_time DateTime column

-- Ensure event_time is nullable (for events where timestamp is unknown)
ALTER TABLE disasters ALTER COLUMN event_time DROP NOT NULL;

-- Add index on event_time for faster queries by disaster occurrence time
CREATE INDEX IF NOT EXISTS idx_disasters_event_time ON disasters(event_time DESC);

-- Add composite index for time-range queries
CREATE INDEX IF NOT EXISTS idx_disasters_extracted_event ON disasters(extracted_at DESC, event_time);

-- Add comment documenting the format
COMMENT ON COLUMN disasters.event_time IS 
  'Disaster occurrence timestamp (UTC datetime). Extracted from social media posts and normalized by normalize_event_time() function. NULL if timestamp could not be determined.';
