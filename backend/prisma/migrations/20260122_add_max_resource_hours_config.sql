-- Migration: Add max_resource_hours configuration
-- Date: 2026-01-22
-- Description: Add global configuration for maximum resource hours

-- Insert global max_resource_hours configuration (team = NULL for global)
INSERT INTO app_config (config_key, config_value, team, description, created_at, updated_at)
VALUES (
    'max_resource_hours',
    '180',
    NULL,
    'Maximum hours that can be assigned to a resource per month (global setting)',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (config_key, team) DO NOTHING;
