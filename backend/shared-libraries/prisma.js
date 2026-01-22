"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = exports.prisma = void 0;

// Import PrismaClient from the generated client in the layer
const { PrismaClient } = require("@prisma/client");

// Create singleton instance
let prismaInstance = null;

function getPrismaInstance() {
    if (!prismaInstance) {
        console.log('Creating new PrismaClient instance');
        prismaInstance = new PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error', 'warn'],
            errorFormat: 'minimal',
        });
        
        // Verify the instance has the expected models
        console.log('PrismaClient models:', Object.keys(prismaInstance).filter(k => !k.startsWith('_') && !k.startsWith('$')));
    }
    return prismaInstance;
}

exports.prisma = getPrismaInstance();

const disconnectPrisma = async () => {
    if (prismaInstance) {
        await prismaInstance.$disconnect();
        prismaInstance = null;
    }
};

exports.disconnectPrisma = disconnectPrisma;
exports.default = exports.prisma;
