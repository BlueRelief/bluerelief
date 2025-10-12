-- Migration: Add post_id to link disasters to their source posts
-- This allows us to use accurate post timestamps instead of extracted_at

-- Add post_id column (nullable for now since existing disasters don't have it)
ALTER TABLE disasters
ADD COLUMN post_id INTEGER;

-- Add foreign key constraint to link to posts table
ALTER TABLE disasters
ADD CONSTRAINT disasters_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Add index for faster lookups
CREATE INDEX idx_disasters_post_id ON disasters(post_id);

