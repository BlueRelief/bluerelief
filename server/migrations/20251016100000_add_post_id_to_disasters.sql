-- Migration: Add post_id to link disasters to their source posts
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'disasters') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'disasters' AND column_name = 'post_id') THEN
            ALTER TABLE disasters ADD COLUMN post_id INTEGER;
            RAISE NOTICE 'Added post_id column to disasters table';
        END IF;
        
        IF NOT EXISTS (
            SELECT FROM information_schema.table_constraints 
            WHERE constraint_name = 'disasters_post_id_fkey' 
            AND table_name = 'disasters'
        ) THEN
            ALTER TABLE disasters
            ADD CONSTRAINT disasters_post_id_fkey 
            FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint';
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE tablename = 'disasters' AND indexname = 'idx_disasters_post_id') THEN
            CREATE INDEX idx_disasters_post_id ON disasters(post_id);
            RAISE NOTICE 'Created index on post_id';
        END IF;
    ELSE
        RAISE NOTICE 'Disasters table does not exist - will be created by base schema';
    END IF;
END $$;

