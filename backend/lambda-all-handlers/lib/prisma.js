/**
 * Prisma Client singleton
 */

const { PrismaClient } = require('@prisma/client');

let prisma = null;

/**
 * Get or create Prisma Client instance
 */
function getPrismaClient() {
    if (!prisma) {
        prisma = new PrismaClient({
            log: ['error', 'warn'],
        });
    }
    return prisma;
}

module.exports = {
    getPrismaClient
};
