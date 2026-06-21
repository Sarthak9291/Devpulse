const prisma = require("../config/prisma");

const createDeployment = async (repositoryId, payload) => {
    const { githubDeploymentId, environment, status, createdAt } = payload;
    return await prisma.deploymentAnalytics.upsert({
        where: { githubDeploymentId },
        update: { environment, status, createdAt: new Date(createdAt) },
        create: { repositoryId, githubDeploymentId, environment, status, createdAt: new Date(createdAt) }
    });
};

const updateDeploymentStatus = async (repositoryId, payload) => {
    const { githubDeploymentId, status, environment, createdAt } = payload;
    return await prisma.deploymentAnalytics.upsert({
        where: { githubDeploymentId },
        update: { status },
        create: { repositoryId, githubDeploymentId, environment, status, createdAt: new Date(createdAt) }
    });
};

const getRepositoryDeployments = async (repositoryId) => {
    return await prisma.deploymentAnalytics.findMany({
        where: { repositoryId: Number(repositoryId) },
        orderBy: { createdAt: "desc" }
    });
};

const handleDeploymentEvent = async (repositoryId, eventType, action, payload) => {
    if (eventType === "deployment") {
        const githubDeploymentId = String(payload.deployment.id);
        const environment = payload.deployment.environment || "production";
        const status = "pending";
        const createdAt = new Date(payload.deployment.created_at);
        await createDeployment(repositoryId, { githubDeploymentId, environment, status, createdAt });
    } else if (eventType === "deployment_status") {
        const githubDeploymentId = String(payload.deployment.id);
        const environment = payload.deployment.environment || "production";
        const status = payload.deployment_status.state;
        const createdAt = new Date(payload.deployment.created_at);
        await updateDeploymentStatus(repositoryId, { githubDeploymentId, status, environment, createdAt });
    }
};

module.exports = {
    createDeployment,
    updateDeploymentStatus,
    getRepositoryDeployments,
    handleDeploymentEvent
};