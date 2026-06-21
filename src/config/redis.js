const IORedis = require('ioredis');

let redisConnection;
try {
    redisConnection = new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6380,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        enableOfflineQueue: true,
        connectTimeout: 5000,
    });

    redisConnection.on('error', (err) => {
        console.warn('Redis connection warning:', err.message);
    });
    redisConnection.on('connect', () => {
        console.log('Redis connected');
    });
} catch (err) {
    console.error('Redis init error:', err.message);
}

module.exports = redisConnection;
