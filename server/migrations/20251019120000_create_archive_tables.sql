-- Create archive tables
CREATE TABLE archived_disasters (
    id SERIAL PRIMARY KEY,
    original_id INTEGER NOT NULL,
    disaster_type VARCHAR(100) NOT NULL,
    location JSONB NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    severity INTEGER,
    affected_population INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE archived_posts (
    id SERIAL PRIMARY KEY,
    original_id INTEGER NOT NULL,
    disaster_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    post_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location JSONB,
    sentiment NUMERIC,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE archived_alerts (
    id SERIAL PRIMARY KEY,
    original_id INTEGER NOT NULL,
    disaster_id INTEGER NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity INTEGER NOT NULL,
    message TEXT NOT NULL,
    location JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_archived_disasters_original_id ON archived_disasters(original_id);
CREATE INDEX idx_archived_disasters_disaster_type ON archived_disasters(disaster_type);
CREATE INDEX idx_archived_disasters_start_time ON archived_disasters(start_time);
CREATE INDEX idx_archived_disasters_end_time ON archived_disasters(end_time);

CREATE INDEX idx_archived_posts_disaster_id ON archived_posts(disaster_id);
CREATE INDEX idx_archived_posts_event_time ON archived_posts(event_time);
CREATE INDEX idx_archived_posts_original_id ON archived_posts(original_id);

CREATE INDEX idx_archived_alerts_disaster_id ON archived_alerts(disaster_id);
CREATE INDEX idx_archived_alerts_original_id ON archived_alerts(original_id);

-- Add archive status to existing disasters table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'disasters'
        AND column_name = 'archived'
    ) THEN
        ALTER TABLE disasters ADD COLUMN archived BOOLEAN DEFAULT FALSE;
    END IF;
END $$;