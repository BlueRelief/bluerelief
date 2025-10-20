-- Migration: Fix event_time column type mismatch
-- Created: 2025-10-20 11:00:00
-- Purpose: Convert event_time from VARCHAR(255) to TIMESTAMP for proper datetime comparisons

-- Convert VARCHAR column to TIMESTAMP, handling NULL and empty string values
-- Empty strings will be converted to NULL
ALTER TABLE disasters 
  ALTER COLUMN event_time TYPE TIMESTAMP USING 
    CASE 
      WHEN event_time = '' THEN NULL
      WHEN event_time IS NULL THEN NULL
      ELSE TO_TIMESTAMP(event_time, 'YYYY-MM-DD"T"HH24:MI:SSOF') 
    END;

-- Re-create indexes to ensure they're valid with the new type
DROP INDEX IF EXISTS idx_disasters_event_time;
CREATE INDEX idx_disasters_event_time ON disasters(event_time DESC);

DROP INDEX IF EXISTS idx_disasters_extracted_event;
CREATE INDEX idx_disasters_extracted_event ON disasters(extracted_at DESC, event_time);

-- Update comment
COMMENT ON COLUMN disasters.event_time IS 
  'Disaster occurrence timestamp (UTC datetime). Extracted from social media posts. NULL if timestamp could not be determined.';
