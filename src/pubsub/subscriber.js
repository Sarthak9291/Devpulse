const IORedis = require("ioredis");

const getSubscriberOptions = () => {
    const commonOptions = {
        retryStrategy: (times) => Math.min(times * 50, 2000),
        connectTimeout: 10000,
        enableReadyCheck: false,
        enableOfflineQueue: true,
    };

    if (process.env.REDIS_URL) {
        const isTls = process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_TLS === 'true';
        return isTls 
            ? { ...commonOptions, tls: { rejectUnauthorized: false } }
            : commonOptions;
    }

    const host = process.env.REDIS_HOST || "localhost";
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

const subscriberOptions = getSubscriberOptions();
const subscriber = process.env.REDIS_URL 
    ? new IORedis(process.env.REDIS_URL, subscriberOptions)
    : new IORedis(subscriberOptions);

subscriber.on('error', (err) => {
    console.warn('Redis subscriber error:', err.message);
});

module.exports = subscriber;