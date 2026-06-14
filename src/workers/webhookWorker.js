const {Worker} = require('bullmq');
const prisma = require('../config/prisma');
const redisConnection = require('../config/redis');
const webhookService= require("../services/webhookService")
const webhookWorker = new Worker('webhook-processing', async (job) => {
    const {
        repositoryId,
        eventType,
        action,
        sender,
        payload
    } = job.data;
    const webhookEvent = await webhookService.createWebhookEvent(repositoryId, eventType, action, sender, payload);
    console.log(
            `Processed job ${job.id} (${eventType})`
        );
    },
    {
        connection:redisConnection
    }
);

webhookWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

webhookWorker.on("failed", (job, err) => {
    console.error(
        `Job ${job?.id} failed:`,
        err.message
    );
});