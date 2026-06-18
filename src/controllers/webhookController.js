
const repoService = require('../services/repoService');
const webhookQueue = require('../queues/webhookQueue');
const crypto = require('crypto');

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
    try{
    if (!isValidSignature(req.body, req.headers['x-hub-signature-256'])) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    let payload;

    try {
        payload = JSON.parse(req.body.toString('utf8'));
    } catch (error) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    if (!payload?.repository?.id) {
        return res.status(400).json({
            error: "Repository ID missing"
        });
    }

    const githubrepoid = payload.repository.id;
    const eventType = req.headers['x-github-event'];
    const action = payload.action||null;
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
    }
);
    res.status(200).json({
         message: 'Webhook event queued successfully' ,
         data:{ jobId: job.id }
        });
}catch(error){
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
};
}
module.exports = {
    handleWebhookEvent
}