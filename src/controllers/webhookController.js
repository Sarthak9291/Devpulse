
const repoService = require('../services/repoService');
const webhookQueue = require('../queues/webhookQueue');
const handleWebhookEvent = async (req, res) => {
    try{
        if (!req.body?.repository?.id) {
    return res.status(400).json({
        error: "Repository ID missing"
    });
}
    const githubrepoid = req.body.repository.id;
    const eventType = req.headers['x-github-event'];
    const action = req.body.action||null;
    const sender = req.body.sender?.login;
    const payload = req.body;
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