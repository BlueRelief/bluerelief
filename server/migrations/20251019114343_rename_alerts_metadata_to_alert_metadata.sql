-- Migration: rename_alerts_metadata_to_alert_metadata
-- Created: 2025-10-19 11:43:43
-- Reason: SQLAlchemy reserves 'metadata' as a keyword, so we renamed it to 'alert_metadata'

ALTER TABLE alerts RENAME COLUMN metadata TO alert_metadata;
