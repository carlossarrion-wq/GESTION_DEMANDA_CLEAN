/**
 * Config Handler
 * Manages generic key-value configuration
 */

const { getPrismaClient } = require('../lib/prisma');
const { createSuccessResponse, createErrorResponse } = require('../lib/response');
const { AppError } = require('../lib/errors');

/**
 * Main handler for config operations
 */
async function handler(event) {
    console.log('Config Handler - Event:', JSON.stringify(event, null, 2));
    
    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.rawPath;
    
    try {
        // GET /config?key=jira_projects&team=SAP
        if (method === 'GET' && path.includes('/config')) {
            return await getConfig(event);
        }
        
        return createErrorResponse(new AppError(`Method ${method} not allowed`, 405));
        
    } catch (error) {
        console.error('Config Handler Error:', error);
        
        if (error instanceof AppError) {
            return createErrorResponse(error);
        }
        
        return createErrorResponse(
            new AppError('Internal server error', 500, error.message)
        );
    }
}

/**
 * Get configuration by key and optionally by team
 * GET /config?key=jira_projects&team=SAP
 */
async function getConfig(event) {
    const queryParams = event.queryStringParameters || {};
    const { key, team } = queryParams;
    
    if (!key) {
        throw new AppError('Missing required parameter: key', 400);
    }
    
    console.log(`Getting config: key=${key}, team=${team || 'null'}`);
    
    const prisma = getPrismaClient();
    
    // Build where clause
    const where = {
        configKey: key,
        isActive: true
    };
    
    // If team is provided, filter by team (case insensitive)
    if (team) {
        // Try exact match first
        let config = await prisma.appConfig.findFirst({
            where: {
                ...where,
                team: team
            },
            select: {
                configKey: true,
                configValue: true,
                configType: true,
                team: true,
                description: true
            }
        });
        
        // If not found, try case-insensitive search
        if (!config) {
            const allConfigs = await prisma.appConfig.findMany({
                where: {
                    configKey: key,
                    isActive: true
                },
                select: {
                    configKey: true,
                    configValue: true,
                    configType: true,
                    team: true,
                    description: true
                }
            });
            
            config = allConfigs.find(c => 
                c.team && c.team.toLowerCase() === team.toLowerCase()
            );
        }
        
        if (!config) {
            throw new AppError(
                `Configuration '${key}' not found for team '${team}'`,
                404
            );
        }
        
        // Parse value according to type
        let value = config.configValue;
        
        try {
            if (config.configType === 'json') {
                value = JSON.parse(value);
            } else if (config.configType === 'number') {
                value = parseFloat(value);
            } else if (config.configType === 'boolean') {
                value = value === 'true' || value === true;
            }
        } catch (parseError) {
            console.error('Error parsing config value:', parseError);
        }
        
        return createSuccessResponse({
            key: config.configKey,
            value: value,
            type: config.configType,
            team: config.team,
            description: config.description
        });
    } else {
        // If no team provided, get global config (team = null)
        where.team = null;
        
        const config = await prisma.appConfig.findFirst({
            where,
            select: {
                configKey: true,
                configValue: true,
                configType: true,
                team: true,
                description: true
            }
        });
        
        if (!config) {
            throw new AppError(
                `Configuration '${key}' not found`,
                404
            );
        }
        
        // Parse value according to type
        let value = config.configValue;
        
        try {
            if (config.configType === 'json') {
                value = JSON.parse(value);
            } else if (config.configType === 'number') {
                value = parseFloat(value);
            } else if (config.configType === 'boolean') {
                value = value === 'true' || value === true;
            }
        } catch (parseError) {
            console.error('Error parsing config value:', parseError);
        }
        
        return createSuccessResponse({
            key: config.configKey,
            value: value,
            type: config.configType,
            team: config.team,
            description: config.description
        });
    }
}

module.exports = { handler };
