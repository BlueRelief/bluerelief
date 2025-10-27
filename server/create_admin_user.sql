-- Script to create an initial admin user
-- Run this SQL in your PostgreSQL database

INSERT INTO users (
    id,
    email,
    name,
    role,
    is_admin,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin-001',
    'admin@bluerelief.com',
    'Administrator',
    'admin',
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    is_admin = true,
    is_active = true,
    updated_at = NOW();

