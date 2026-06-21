const sendNotification = async (channel, message) => {
    console.log(`[Notification][${channel}] ${message}`);
    const webhookUrl = channel === 'slack' ? process.env.SLACK_WEBHOOK_URL : process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(channel === 'slack' ? { text: message } : { content: message })
            });
        } catch (error) {
            console.error(`Failed to send ${channel} notification:`, error.message);
        }
    }
};

const notifyFailedBuild = async (repoName, buildInfo) => {
    const message = `🚨 **Build Failed** in repository *${repoName}*\nWorkflow: ${buildInfo.workflowName}\nTriggered by: ${buildInfo.sender}`;
    await sendNotification('slack', message);
    await sendNotification('discord', message);
};

const notifyFailedDeployment = async (repoName, deployInfo) => {
    const message = `💥 **Deployment Failed** in repository *${repoName}*\nEnvironment: ${deployInfo.environment}\nTriggered by: ${deployInfo.sender}`;
    await sendNotification('slack', message);
    await sendNotification('discord', message);
};

const notifyStalePR = async (repoName, prInfo) => {
    const message = `⏳ **Stale PR Warning** in repository *${repoName}*\nPR ID: ${prInfo.githubPrId} has been open for ${prInfo.daysOpen} days without merging.`;
    await sendNotification('slack', message);
    await sendNotification('discord', message);
};

const notifyHealthDrop = async (repoName, oldScore, newScore) => {
    const message = `📉 **Health Score Dropped** for repository *${repoName}*\nPrevious Score: ${oldScore} | New Score: ${newScore}`;
    await sendNotification('slack', message);
    await sendNotification('discord', message);
};

module.exports = {
    notifyFailedBuild,
    notifyFailedDeployment,
    notifyStalePR,
    notifyHealthDrop
};
