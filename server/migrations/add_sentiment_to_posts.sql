-- Add sentiment analysis columns to posts table
-- Migration: add_sentiment_to_posts
-- Created: 2025-10-11

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS sentiment VARCHAR(50),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;

-- Create index for sentiment queries
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment_score ON posts(sentiment_score);

