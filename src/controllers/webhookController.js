const repoService = require('../services/repoService');
const webhookQueue = require('../queues/webhookQueue');
const crypto = require('crypto');
const redisConnection = require('../config/redis');
const prisma = require('../config/prisma');

const isValidSignature = (rawBody, signature) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret || !signature || !Buffer.isBuffer(rawBody)) {
        return false;
    }

    const expected = `sha256=${crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')}`;

    if (expected.length !== signature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature)
    );
};

const handleWebhookEvent = async (req, res) => {
    try {
        if (!isValidSignature(req.body, req.headers['x-hub-signature-256'])) {
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }

        let payload;
        try {
            payload = JSON.parse(req.body.toString('utf8'));
        } catch (error) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        // Webhook Idempotency check using X-GitHub-Delivery header
        const deliveryId = req.headers['x-github-delivery'];
        if (deliveryId) {
            const isDuplicate = await redisConnection.get(`webhook:delivery:${deliveryId}`);
            if (isDuplicate) {
                return res.status(200).json({
                    message: 'Webhook event already processed (idempotent)',
                    data: { duplicate: true }
                });
            }
            // Cache delivery ID for 24 hours
            await redisConnection.set(`webhook:delivery:${deliveryId}`, 'processed', 'EX', 86400);
        }

        if (!payload?.repository?.id) {
            return res.status(400).json({
                error: "Repository ID missing"
            });
        }

        const githubrepoid = payload.repository.id;
        const eventType = req.headers['x-github-event'];
        const action = payload.action || null;
        const sender = payload.sender?.login;
        
        const repository = await repoService.getRepositoryByGithuhbId(githubrepoid);
        if (!repository) {
            return res.status(404).json({ error: 'Repository not found' });
        }
        
        const job = await webhookQueue.add(
            "github-event",
            {
                repositoryId: repository.id,
                eventType,
                action,
                sender,
                payload
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        );
        
        res.status(200).json({
            message: 'Webhook event queued successfully',
            data: { jobId: job.id }
        });
    } catch (error) {
        console.error("Webhook processing error:", error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const replayWebhookEvent = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);
        const webhookEvent = await prisma.webhookEvent.findUnique({
            where: { id: eventId }
        });
        
        if (!webhookEvent) {
            return res.status(404).json({
                success: false,
                message: "Webhook event not found"
            });
        }

        const job = await webhookQueue.add(
            "github-event",
            {
                repositoryId: webhookEvent.repositoryId,
                eventType: webhookEvent.eventType,
                action: webhookEvent.action,
                sender: webhookEvent.sender,
                payload: webhookEvent.payload
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                },
                removeOnComplete: true,
                removeOnFail: false
            }
        );

        res.status(200).json({
            success: true,
            message: 'Webhook event successfully replayed into processing queue',
            data: { jobId: job.id }
        });
    } catch (error) {
        console.error("Replay webhook error:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to replay webhook event",
            error: error.message
        });
    }
};

module.exports = {
    handleWebhookEvent,
    replayWebhookEvent
};