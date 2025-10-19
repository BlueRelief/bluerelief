-- Migration: rename_alerts_metadata_to_alert_metadata
-- Created: 2025-10-19 11:43:43
-- Reason: SQLAlchemy reserves 'metadata' as a keyword, so we renamed it to 'alert_metadata'

DO $$
BEGIN
    -- Check if the column exists before attempting to rename
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'alerts'
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE alerts RENAME COLUMN metadata TO alert_metadata;
    ELSE
        -- If metadata column doesn't exist, check if alert_metadata exists
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = 'alerts'
            AND column_name = 'alert_metadata'
        ) THEN
            -- If neither column exists, create alert_metadata
            ALTER TABLE alerts ADD COLUMN alert_metadata JSONB;
        END IF;
    END IF;
END $$;
