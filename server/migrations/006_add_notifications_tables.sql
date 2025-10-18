-- Migration: add_notifications_tables
-- Adds user_notification_preferences and email_logs tables

DO $$
BEGIN
    -- user_notification_preferences
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_notification_preferences') THEN
        CREATE TABLE user_notification_preferences (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL REFERENCES users(id),
            email_opt_in BOOLEAN DEFAULT TRUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    -- email_logs
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_logs') THEN
        CREATE TABLE email_logs (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) REFERENCES users(id),
            crisis_id INTEGER REFERENCES disasters(id),
            email_status VARCHAR(50),
            provider_message_id VARCHAR(255),
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            opened_at TIMESTAMP,
            payload JSONB
        );
    END IF;
END $$;
