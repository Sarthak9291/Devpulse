const IORedis = require('ioredis');

const getRedisOptions = () => {
    const commonOptions = {
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        enableReadyCheck: false,
        enableOfflineQueue: true,
        connectTimeout: 10000,
    };

    if (process.env.REDIS_URL) {
        const isTls = process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_TLS === 'true';
        return isTls 
            ? { ...commonOptions, tls: { rejectUnauthorized: false } }
            : commonOptions;
    }

    const host = process.env.REDIS_HOST || 'localhost';
    const port = Number(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    const options = {
        ...commonOptions,
        host,
        port,
        password,
    };

    if (process.env.REDIS_TLS === 'true') {
        options.tls = { rejectUnauthorized: false };
    }

    return options;
};

let redisConnection;
try {
    const options = getRedisOptions();
    if (process.env.REDIS_URL) {
        redisConnection = new IORedis(process.env.REDIS_URL, options);
    } else {
        redisConnection = new IORedis(options);
    }

    redisConnection.on('error', (err) => {
        console.warn('Redis connection warning:', err.message);
    });
    redisConnection.on('connect', () => {
        console.log('Redis connected successfully');
    });
} catch (err) {
    console.error('Redis init error:', err.message);
}

module.exports = redisConnection;

