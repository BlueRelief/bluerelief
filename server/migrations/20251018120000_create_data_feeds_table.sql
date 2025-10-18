-- Create data_feeds table to track feed configurations and status
CREATE TABLE IF NOT EXISTS data_feeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  feed_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  total_runs INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add initial Bluesky feed entry
INSERT INTO data_feeds (name, feed_type, status, last_run_at, next_run_at, total_runs, created_at, updated_at) VALUES
  ('Bluesky Crisis Monitor', 'bluesky', 'active', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '1 hour', 0, NOW(), NOW());

