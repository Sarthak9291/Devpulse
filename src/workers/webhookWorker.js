const activityService = require("../services/activityService");
const { Worker } = require('bullmq');
const prisma = require('../config/prisma');
const redisConnection = require('../config/redis');
const webhookService = require("../services/webhookService")
const metricsService = require("../services/metricsService");
const deploymentAnalyticsService = require("../services/deploymentAnalyticsService");
const prAnalyticsService = require("../services/prAnalyticsService");
const notificationService = require("../services/notificationService");
const { publishActivity, publishMetrics } = require("../pubsub/publisher");

const clearRepositoryCache = async (repositoryId) => {
    const keys = [
        `cache:/dashboard/repository/${repositoryId}`,
        `cache:/dora/${repositoryId}`,
        `cache:/pr/${repositoryId}/bottlenecks`
    ];
    try {
        const repo = await prisma.repository.findUnique({
            where: { id: repositoryId },
            select: { organizationId: true }
        });
        if (repo) {
            keys.push(`cache:/orgs/${repo.organizationId}/analytics`);
            keys.push(`cache:/ai/repository/${repositoryId}`);
            keys.push(`cache:/ai/organization/${repo.organizationId}`);
        }
    } catch (err) {
        console.error("Error finding repository org for cache clear:", err.message);
    }
    
    for (const key of keys) {
        await redisConnection.del(key).catch(err => console.error("Cache clear error:", err.message));
    }
};

const webhookWorker = new Worker('webhook-processing', async (job) => {
    const {
        repositoryId,
        eventType,
        action,
        sender,
        payload
    } = job.data;
    
    console.log(`Processing ${eventType} for repository ${repositoryId}`);
    
    const webhookEvent = await webhookService.createWebhookEvent(repositoryId, eventType, action, sender, payload);
    const activity = await activityService.createActivity(repositoryId, eventType, action, sender, payload);
    
    // Publish via Redis Pub/Sub instead of direct Socket.io emit
    await publishActivity(activity);
    
    await metricsService.updateMetrics(repositoryId, eventType, action, payload);

    // Track analytics events for DORA and PR Bottlenecks
    if (eventType === "pull_request") {
        await prAnalyticsService.handlePullRequestEvent(repositoryId, action, payload);
    } else if (eventType === "pull_request_review") {
        await prAnalyticsService.handlePullRequestReviewEvent(repositoryId, action, payload);
    } else if (eventType === "deployment" || eventType === "deployment_status") {
        await deploymentAnalyticsService.handleDeploymentEvent(repositoryId, eventType, action, payload);
    }

    // Trigger failure notifications
    if (eventType === "workflow_run" && payload.workflow_run?.conclusion === "failure") {
        const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
        if (repo) {
            await notificationService.notifyFailedBuild(repo.name, {
                workflowName: payload.workflow_run.name || "default",
                sender
            });
        }
    } else if (eventType === "deployment_status" && payload.deployment_status?.state === "failure") {
        const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
        if (repo) {
            await notificationService.notifyFailedDeployment(repo.name, {
                environment: payload.deployment?.environment || "production",
                sender
            });
        }
    }

    const metrics = await metricsService.getRepositoryMetrics(repositoryId);
    
    // Publish metrics update via Redis Pub/Sub
    await publishMetrics(repositoryId, metrics);
    
    // Clear affected response cache keys
    await clearRepositoryCache(repositoryId);

    return {
        webhookEventId: webhookEvent.id,
        activityId: activity.id
    };
}, {
    connection: redisConnection
});

webhookWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

webhookWorker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});