-- Migration: Create app_config table for generic key-value configuration
-- Date: 2026-01-21

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    config_type VARCHAR(50) DEFAULT 'string',
    team VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_config_key_team UNIQUE(config_key, team)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_config_key_team ON app_config(config_key, team);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON app_config(is_active);

-- Insert initial data: Jira projects configuration per team
-- Each team has access to NC (common) + their specific project

-- Equipo SAP: acceso a NC y SISU
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('jira_projects', '[
    {"key":"NC","name":"Naturgy Clientes","url":"https://naturgy-adn.atlassian.net/jira/core/projects/NC"},
    {"key":"SISU","name":"SAP","url":"https://naturgy-adn.atlassian.net/jira/core/projects/SISU"}
]', 'json', 'SAP', 'Proyectos Jira disponibles para el equipo SAP')
ON CONFLICT (config_key, team) DO NOTHING;

-- Equipo SAPLCORP: acceso a NC y SCOM
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('jira_projects', '[
    {"key":"NC","name":"Naturgy Clientes","url":"https://naturgy-adn.atlassian.net/jira/core/projects/NC"},
    {"key":"SCOM","name":"SAP LCORP","url":"https://naturgy-adn.atlassian.net/jira/core/projects/SCOM"}
]', 'json', 'SAPLCORP', 'Proyectos Jira disponibles para el equipo SAPLCORP')
ON CONFLICT (config_key, team) DO NOTHING;

-- Equipo Mulesoft: acceso a NC y MUL
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('jira_projects', '[
    {"key":"NC","name":"Naturgy Clientes","url":"https://naturgy-adn.atlassian.net/jira/core/projects/NC"},
    {"key":"MUL","name":"Mulesoft","url":"https://naturgy-adn.atlassian.net/jira/core/projects/MUL"}
]', 'json', 'Mulesoft', 'Proyectos Jira disponibles para el equipo Mulesoft')
ON CONFLICT (config_key, team) DO NOTHING;

-- Equipo Darwin: acceso a NC y DAR
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('jira_projects', '[
    {"key":"NC","name":"Naturgy Clientes","url":"https://naturgy-adn.atlassian.net/jira/core/projects/NC"},
    {"key":"DAR","name":"Darwin","url":"https://naturgy-adn.atlassian.net/jira/core/projects/DAR"}
]', 'json', 'Darwin', 'Proyectos Jira disponibles para el equipo Darwin')
ON CONFLICT (config_key, team) DO NOTHING;

-- Equipo NC (default): solo acceso a NC
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('jira_projects', '[
    {"key":"NC","name":"Naturgy Clientes","url":"https://naturgy-adn.atlassian.net/jira/core/projects/NC"}
]', 'json', 'NC', 'Proyectos Jira disponibles para el equipo NC')
ON CONFLICT (config_key, team) DO NOTHING;

-- Insert other example configurations
INSERT INTO app_config (config_key, config_value, config_type, team, description) VALUES
('default_capacity', '160', 'number', NULL, 'Capacidad por defecto en horas/mes'),
('max_import_batch', '10', 'number', NULL, 'Máximo de proyectos a importar simultáneamente'),
('enable_notifications', 'true', 'boolean', NULL, 'Habilitar notificaciones del sistema')
ON CONFLICT (config_key, team) DO NOTHING;
