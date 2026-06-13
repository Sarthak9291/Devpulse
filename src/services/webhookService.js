
const createWebhookEvent= async (repositoryId,eventType,action,sender,payload) => {

  const webhookEvent = await prisma.webhookEvent.create({
    data: {
        repositoryId,
        eventType,
        action,
        sender,
        payload
    }
});

return webhookEvent;
}
module.exports = {
    createWebhookEvent
}

