-- Add disaster_type column to posts table
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'posts') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'disaster_type') THEN
            ALTER TABLE posts ADD COLUMN disaster_type VARCHAR(50);
            RAISE NOTICE 'Added disaster_type column to posts table';
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'posts' AND indexname = 'ix_posts_disaster_type') THEN
            CREATE INDEX ix_posts_disaster_type ON posts(disaster_type);
            RAISE NOTICE 'Created index on disaster_type';
        END IF;
    ELSE
        RAISE NOTICE 'Posts table does not exist - will be created by base schema';
    END IF;
END $$;