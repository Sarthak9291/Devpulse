require('dotenv').config();

console.log('----------------------------------------------------');
console.log('  DevPulse Background Webhook Worker Process');
console.log('----------------------------------------------------');

const redisConnection = require('./src/config/redis');
const prisma = require('./src/config/prisma');
require('./src/workers/webhookWorker');

console.log('BullMQ Webhook Worker listening for jobs...');

const shutdown = async (signal) => {
    console.log(`Worker received ${signal}. Draining jobs and shutting down...`);
    try {
        await prisma.$disconnect();
        if (redisConnection && redisConnection.quit) {
            await redisConnection.quit();
        }
    } catch (err) {
        console.error('Error during worker shutdown:', err.message);
    }
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
