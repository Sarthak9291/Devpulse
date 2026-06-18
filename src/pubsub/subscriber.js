const IORedis = require("ioredis");

const subscriber = new IORedis({
    host:
        process.env.REDIS_HOST ||
        "localhost",

    port:
        process.env.REDIS_PORT ||
        6379
});

module.exports = subscriber;