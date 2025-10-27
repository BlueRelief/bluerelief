-- Script to create an initial admin user
-- Run this SQL in your PostgreSQL database
-- This upsert is idempotent and handles conflicts on email uniquely

INSERT INTO users (
    id,
    email,
    name,
    role,
    is_admin,
    is_active,
    failed_login_attempts,
    created_at,
    updated_at
) VALUES (
    'admin-' || extract(epoch from now())::bigint,
    'admin@bluerelief.com',
    'Administrator',
    'admin',
    true,
    true,
    0,
    NOW(),
    NOW()
)
ON CONFLICT ON CONSTRAINT users_email_key DO UPDATE SET
    id = users.id,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    is_active = EXCLUDED.is_active,
    failed_login_attempts = EXCLUDED.failed_login_attempts,
    updated_at = NOW();

