/**
 * Custom error classes
 */

class AppError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.details = details;
        this.code = this.getErrorCode(statusCode);
    }

    getErrorCode(statusCode) {
        const codes = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            500: 'INTERNAL_ERROR'
        };
        return codes[statusCode] || 'UNKNOWN_ERROR';
    }
}

module.exports = {
    AppError
};
