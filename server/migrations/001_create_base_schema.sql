-- Base schema migration for BlueRelief
-- Creates all core tables if they don't exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_superuser BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collection runs table
CREATE TABLE IF NOT EXISTS collection_runs (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'running',
    posts_collected INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS ix_collection_runs_id ON collection_runs(id);

-- Posts table (base columns only, new columns added by ALTER migrations)
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    bluesky_id VARCHAR(255) UNIQUE NOT NULL,
    author_handle VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    raw_data JSONB,
    collection_run_id INTEGER NOT NULL REFERENCES collection_runs(id)
);

CREATE INDEX IF NOT EXISTS ix_posts_id ON posts(id);
CREATE INDEX IF NOT EXISTS ix_posts_bluesky_id ON posts(bluesky_id);

-- Disasters table (base columns only, post_id added by ALTER migration)
CREATE TABLE IF NOT EXISTS disasters (
    id SERIAL PRIMARY KEY,
    location VARCHAR(500),
    event_time VARCHAR(255),
    severity INTEGER,
    magnitude FLOAT,
    description TEXT,
    extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    collection_run_id INTEGER NOT NULL REFERENCES collection_runs(id)
);

CREATE INDEX IF NOT EXISTS ix_disasters_id ON disasters(id);

