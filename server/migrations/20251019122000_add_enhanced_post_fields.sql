-- Add enhanced post fields for better analytics
DO $$
DECLARE
    col_exists boolean;
BEGIN
    -- Post engagement metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'like_count') THEN
        ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'repost_count') THEN
        ALTER TABLE posts ADD COLUMN repost_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reply_count') THEN
        ALTER TABLE posts ADD COLUMN reply_count INTEGER DEFAULT 0;
    END IF;

    -- Author profile info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_display_name') THEN
        ALTER TABLE posts ADD COLUMN author_display_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_description') THEN
        ALTER TABLE posts ADD COLUMN author_description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_followers_count') THEN
        ALTER TABLE posts ADD COLUMN author_followers_count INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_following_count') THEN
        ALTER TABLE posts ADD COLUMN author_following_count INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_posts_count') THEN
        ALTER TABLE posts ADD COLUMN author_posts_count INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'author_avatar_url') THEN
        ALTER TABLE posts ADD COLUMN author_avatar_url TEXT;
    END IF;

    -- Post metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'has_media') THEN
        ALTER TABLE posts ADD COLUMN has_media BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_count') THEN
        ALTER TABLE posts ADD COLUMN media_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'media_urls') THEN
        ALTER TABLE posts ADD COLUMN media_urls TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'hashtags') THEN
        ALTER TABLE posts ADD COLUMN hashtags TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'mentions') THEN
        ALTER TABLE posts ADD COLUMN mentions TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'external_urls') THEN
        ALTER TABLE posts ADD COLUMN external_urls TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'language') THEN
        ALTER TABLE posts ADD COLUMN language VARCHAR(10);
    END IF;

    -- Location data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'post_location') THEN
        ALTER TABLE posts ADD COLUMN post_location VARCHAR(500);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'post_latitude') THEN
        ALTER TABLE posts ADD COLUMN post_latitude FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'post_longitude') THEN
        ALTER TABLE posts ADD COLUMN post_longitude FLOAT;
    END IF;

    -- Temporal data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'indexed_at') THEN
        ALTER TABLE posts ADD COLUMN indexed_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'last_modified_at') THEN
        ALTER TABLE posts ADD COLUMN last_modified_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Labels and categorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content_labels') THEN
        ALTER TABLE posts ADD COLUMN content_labels TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'content_warnings') THEN
        ALTER TABLE posts ADD COLUMN content_warnings TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'moderation_status') THEN
        ALTER TABLE posts ADD COLUMN moderation_status VARCHAR(50);
    END IF;

    -- Reply context
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reply_to_post_id') THEN
        ALTER TABLE posts ADD COLUMN reply_to_post_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'reply_root_post_id') THEN
        ALTER TABLE posts ADD COLUMN reply_root_post_id VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'thread_depth') THEN
        ALTER TABLE posts ADD COLUMN thread_depth INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add indexes for commonly queried fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_like_count') THEN
        CREATE INDEX idx_posts_like_count ON posts(like_count);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_repost_count') THEN
        CREATE INDEX idx_posts_repost_count ON posts(repost_count);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_reply_count') THEN
        CREATE INDEX idx_posts_reply_count ON posts(reply_count);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_has_media') THEN
        CREATE INDEX idx_posts_has_media ON posts(has_media);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_language') THEN
        CREATE INDEX idx_posts_language ON posts(language);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_moderation_status') THEN
        CREATE INDEX idx_posts_moderation_status ON posts(moderation_status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_posts_indexed_at') THEN
        CREATE INDEX idx_posts_indexed_at ON posts(indexed_at);
    END IF;
END $$;