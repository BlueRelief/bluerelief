-- Migration: remove_redundant_location_field_from_disasters_table
-- Created: 2025-10-19 21:30:40
-- Purpose: Remove redundant location field, keep structured data (location_name, latitude, longitude)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disasters' AND column_name = 'location') THEN
        ALTER TABLE disasters DROP COLUMN location;
    END IF;
END $$;
