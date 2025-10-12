-- Add disaster_type column to posts table
ALTER TABLE posts ADD COLUMN disaster_type VARCHAR(50);
CREATE INDEX ix_posts_disaster_type ON posts(disaster_type);