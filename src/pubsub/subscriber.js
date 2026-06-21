const IORedis = require("ioredis");

const subscriber = new IORedis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    connectTimeout: 5000,
    enableReadyCheck: false,
    enableOfflineQueue: true,
});

subscriber.on('error', (err) => {
    console.warn('Redis subscriber error:', err.message);
});

module.exports = subscriber;