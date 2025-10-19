-- Migration: add user_id to alert_queue
-- Created: 2025-10-19 11:19:58

-- Add user_id column to alert_queue
ALTER TABLE alert_queue
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Add foreign key constraint
ALTER TABLE alert_queue
ADD CONSTRAINT fk_alert_queue_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_alert_queue_user_id ON alert_queue(user_id);
