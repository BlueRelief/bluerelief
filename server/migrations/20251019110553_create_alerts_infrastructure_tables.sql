-- Migration: create alerts infrastructure tables
-- Created: 2025-10-19 11:05:53

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  disaster_id INTEGER REFERENCES disasters(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_alerts_disaster_id ON alerts(disaster_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read);

-- Create alert_queue table for email service
CREATE TABLE IF NOT EXISTS alert_queue (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  priority INTEGER DEFAULT 3,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alert_queue_status ON alert_queue(status);
CREATE INDEX IF NOT EXISTS idx_alert_queue_scheduled_at ON alert_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_alert_queue_priority ON alert_queue(priority);
CREATE INDEX IF NOT EXISTS idx_alert_queue_alert_id ON alert_queue(alert_id);

-- Create user_alert_preferences table
CREATE TABLE IF NOT EXISTS user_alert_preferences (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  alert_types JSONB DEFAULT '["new_crisis", "severity_change", "update"]'::jsonb,
  min_severity INTEGER DEFAULT 3,
  email_enabled BOOLEAN DEFAULT TRUE,
  regions JSONB,
  disaster_types JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_alert_preferences_user_id ON user_alert_preferences(user_id);
