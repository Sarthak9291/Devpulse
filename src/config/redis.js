const IORedis = require('ioredis');
const redisConnection = new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
});

module.exports = redisConnection;
