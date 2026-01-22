"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;

const { query } = require("./lib/db");
const response_1 = require("./lib/response");
const errors_1 = require("./lib/errors");

const handler = async (event) => {
    console.log('Skills Handler - Event:', JSON.stringify(event, null, 2));
    
    const method = event.httpMethod;
    
    if (method === 'OPTIONS') {
        return (0, response_1.optionsResponse)();
    }
    
    try {
        if (method === 'GET') {
            return await listSkills(event.queryStringParameters || {});
        }
        
        return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
    } catch (error) {
        console.error('Error in skillsHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};

exports.handler = handler;

async function listSkills(queryParams) {
    const { team } = queryParams;
    
    let sql = `
        SELECT DISTINCT rs.skill_name as name, COUNT(rs.resource_id) as resource_count
        FROM resource_skills rs
        INNER JOIN resources r ON rs.resource_id = r.id
        WHERE r.active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (team) {
        sql += ` AND r.team = $${paramIndex++}`;
        params.push(team);
    }
    
    sql += `
        GROUP BY rs.skill_name
        ORDER BY rs.skill_name ASC
    `;
    
    const result = await query(sql, params);
    
    return (0, response_1.successResponse)({
        skills: result.rows,
        count: result.rows.length
    });
}
