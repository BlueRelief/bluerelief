-- Add disaster_type to disasters table (idempotent)
ALTER TABLE disasters
ADD COLUMN IF NOT EXISTS disaster_type VARCHAR(255);
