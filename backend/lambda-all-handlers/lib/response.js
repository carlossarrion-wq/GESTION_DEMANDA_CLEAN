/**
 * Response utilities for Lambda handlers
 */

/**
 * Create a success response with CORS headers
 */
function createSuccessResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            success: true,
            data
        })
    };
}

/**
 * Create an error response with CORS headers
 */
function createErrorResponse(error, statusCode = null) {
    const status = statusCode || error.statusCode || 500;
    
    return {
        statusCode: status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,x-user-team',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            success: false,
            error: {
                message: error.message || 'Internal server error',
                code: error.code || 'INTERNAL_ERROR',
                details: error.details || null
            }
        })
    };
}

module.exports = {
    createSuccessResponse,
    createErrorResponse
};
