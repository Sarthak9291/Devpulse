const activityService = require("../services/activityService");
const {Worker} = require('bullmq');
const prisma = require('../config/prisma');
const redisConnection = require('../config/redis');
const webhookService= require("../services/webhookService")
const metricsService = require("../services/metricsService");

const webhookWorker = new Worker('webhook-processing', async (job) => {
    const {
        repositoryId,
        eventType,
        action,
        sender,
        payload
    } = job.data;
    console.log(
    `Processing ${eventType} for repository ${repositoryId}`
);
    const webhookEvent = await webhookService.createWebhookEvent(repositoryId, eventType, action, sender, payload);
    const activity = await activityService.createActivity(repositoryId, eventType, action, sender, payload);
    await metricsService.updateMetrics(repositoryId, eventType, action, payload);
     return {
            webhookEventId: webhookEvent.id,
            activityId: activity.id
        };
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