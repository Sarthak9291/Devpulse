const {Queue} = require('bullmq');
const redisConnection = require('../config/redis');

const webhookQueue = new Queue('webhook-processing', {
    connection: redisConnection,
});

module.exports = webhookQueue;