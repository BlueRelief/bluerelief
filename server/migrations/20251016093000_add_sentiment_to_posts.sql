-- Add sentiment analysis columns to posts table
-- Migration: add_sentiment_to_posts
-- Created: 2025-10-11

-- Only run if posts table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts') THEN
        -- Add sentiment columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'sentiment') THEN
            ALTER TABLE posts ADD COLUMN sentiment VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'sentiment_score') THEN
            ALTER TABLE posts ADD COLUMN sentiment_score FLOAT;
        END IF;
        
        -- Create indexes
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'idx_posts_sentiment') THEN
            CREATE INDEX idx_posts_sentiment ON posts(sentiment);
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'idx_posts_sentiment_score') THEN
            CREATE INDEX idx_posts_sentiment_score ON posts(sentiment_score);
        END IF;
        
        RAISE NOTICE 'Sentiment columns and indexes added successfully';
    ELSE
        RAISE NOTICE 'Posts table does not exist yet - skipping migration (will be created by SQLAlchemy)';
    END IF;
END $$;

