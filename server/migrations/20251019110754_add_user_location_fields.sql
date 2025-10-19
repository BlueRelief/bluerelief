-- Migration: add user location fields
-- Created: 2025-10-19 11:07:54

-- Add location fields to users table for alert region filtering
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS latitude FLOAT,
ADD COLUMN IF NOT EXISTS longitude FLOAT;
