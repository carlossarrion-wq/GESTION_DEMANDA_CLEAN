"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;

const { query } = require("./lib/db");
const response_1 = require("./lib/response");
const errors_1 = require("./lib/errors");

const handler = async (event) => {
    console.log('Config Handler - Event:', JSON.stringify(event, null, 2));
    
    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath;
    
    try {
        if (method === 'OPTIONS') {
            return (0, response_1.optionsResponse)();
        }
        
        // GET /config?key=jira_projects&team=SAP
        if (method === 'GET' && path.includes('/config')) {
            return await getConfig(event);
        }
        
        return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
        
    } catch (error) {
        console.error('Config Handler Error:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};

exports.handler = handler;

async function getConfig(event) {
    const queryParams = event.queryStringParameters || {};
    const { key, team } = queryParams;
    
    if (!key) {
        return (0, response_1.errorResponse)('Missing required parameter: key', 400);
    }
    
    console.log(`Getting config: key=${key}, team=${team || 'null'}`);
    
    let sql;
    let params;
    
    if (team) {
        // Try exact match first
        sql = `
            SELECT config_key, config_value, config_type, team, description
            FROM app_config
            WHERE config_key = $1
            AND team = $2
            AND is_active = true
            LIMIT 1
        `;
        params = [key, team];
        
        let result = await query(sql, params);
        
        // If not found, try case-insensitive search
        if (result.rows.length === 0) {
            sql = `
                SELECT config_key, config_value, config_type, team, description
                FROM app_config
                WHERE config_key = $1
                AND LOWER(team) = LOWER($2)
                AND is_active = true
                LIMIT 1
            `;
            result = await query(sql, params);
        }
        
        if (result.rows.length === 0) {
            return (0, response_1.errorResponse)(
                `Configuration '${key}' not found for team '${team}'`,
                404
            );
        }
        
        const config = result.rows[0];
        
        // Parse value according to type
        let value = config.config_value;
        
        try {
            if (config.config_type === 'json') {
                value = JSON.parse(value);
            } else if (config.config_type === 'number') {
                value = parseFloat(value);
            } else if (config.config_type === 'boolean') {
                value = value === 'true' || value === true;
            }
        } catch (parseError) {
            console.error('Error parsing config value:', parseError);
        }
        
        return (0, response_1.successResponse)({
            key: config.config_key,
            value: value,
            type: config.config_type,
            team: config.team,
            description: config.description
        });
    } else {
        // If no team provided, get global config (team = null)
        sql = `
            SELECT config_key, config_value, config_type, team, description
            FROM app_config
            WHERE config_key = $1
            AND team IS NULL
            AND is_active = true
            LIMIT 1
        `;
        params = [key];
        
        const result = await query(sql, params);
        
        if (result.rows.length === 0) {
            return (0, response_1.errorResponse)(
                `Configuration '${key}' not found`,
                404
            );
        }
        
        const config = result.rows[0];
        
        // Parse value according to type
        let value = config.config_value;
        
        try {
            if (config.config_type === 'json') {
                value = JSON.parse(value);
            } else if (config.config_type === 'number') {
                value = parseFloat(value);
            } else if (config.config_type === 'boolean') {
                value = value === 'true' || value === true;
            }
        } catch (parseError) {
            console.error('Error parsing config value:', parseError);
        }
        
        return (0, response_1.successResponse)({
            key: config.config_key,
            value: value,
            type: config.config_type,
            team: config.team,
            description: config.description
        });
    }
}
