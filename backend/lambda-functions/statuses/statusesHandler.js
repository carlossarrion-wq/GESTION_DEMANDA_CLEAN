"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;

const { query } = require("./lib/db");
const response_1 = require("./lib/response");
const errors_1 = require("./lib/errors");

const handler = async (event) => {
    const method = event.httpMethod;
    
    if (method === 'OPTIONS') {
        return (0, response_1.optionsResponse)();
    }
    
    try {
        if (method === 'GET') {
            return await listStatuses();
        }
        
        return (0, response_1.errorResponse)(`Method ${method} not allowed`, 405);
    } catch (error) {
        console.error('Error in statusesHandler:', error);
        const { statusCode, message } = (0, errors_1.handleError)(error);
        return (0, response_1.errorResponse)(message, statusCode, error);
    }
};

exports.handler = handler;

async function listStatuses() {
    const sql = `
        SELECT id, name, "order"
        FROM statuses
        ORDER BY "order" ASC
    `;
    
    const result = await query(sql, []);
    
    return (0, response_1.successResponse)(result.rows);
}
