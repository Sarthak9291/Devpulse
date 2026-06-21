const prisma = require("../config/prisma");

const getRepositoryDoraMetrics = async (repositoryId) => {
    const repoId = Number(repositoryId);

    // 1. Deployment Frequency (Count of successful deployments in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const successfulDeploymentsCount = await prisma.deploymentAnalytics.count({
        where: {
            repositoryId: repoId,
            status: "success",
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    let deploymentFrequencyRating = "Low";
    if (successfulDeploymentsCount >= 30) {
        deploymentFrequencyRating = "Elite";
    } else if (successfulDeploymentsCount >= 4) {
        deploymentFrequencyRating = "High";
    } else if (successfulDeploymentsCount >= 1) {
        deploymentFrequencyRating = "Medium";
    }

    // 2. Change Failure Rate (Failed / Total Deployments in last 30 days)
    const totalDeploymentsCount = await prisma.deploymentAnalytics.count({
        where: {
            repositoryId: repoId,
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    const failedDeploymentsCount = await prisma.deploymentAnalytics.count({
        where: {
            repositoryId: repoId,
            status: "failure",
            createdAt: { gte: thirtyDaysAgo }
        }
    });

    const changeFailureRate = totalDeploymentsCount === 0 
        ? 0 
        : Number(((failedDeploymentsCount / totalDeploymentsCount) * 100).toFixed(2));

    // 3. Lead Time For Changes (PR Merged to Next Successful Deployment)
    const mergedPRs = await prisma.pullRequestAnalytics.findMany({
        where: {
            repositoryId: repoId,
            mergedAt: { not: null }
        },
        orderBy: { mergedAt: "asc" }
    });

    let totalLeadTimeMs = 0;
    let leadTimeCount = 0;

    for (const pr of mergedPRs) {
        const firstSuccessDeploy = await prisma.deploymentAnalytics.findFirst({
            where: {
                repositoryId: repoId,
                status: "success",
                createdAt: { gt: pr.mergedAt }
            },
            orderBy: { createdAt: "asc" }
        });

        if (firstSuccessDeploy) {
            totalLeadTimeMs += (firstSuccessDeploy.createdAt.getTime() - pr.mergedAt.getTime());
            leadTimeCount++;
        }
    }

    const leadTimeHours = leadTimeCount === 0 
        ? 0 
        : Number((totalLeadTimeMs / (1000 * 60 * 60 * leadTimeCount)).toFixed(2));

    // 4. Mean Time To Recovery (MTTR) (Failed Deployment to Next Successful Deployment)
    const failedDeployments = await prisma.deploymentAnalytics.findMany({
        where: {
            repositoryId: repoId,
            status: "failure"
        },
        orderBy: { createdAt: "asc" }
    });

    let totalRecoveryTimeMs = 0;
    let recoveryCount = 0;

    for (const failedDep of failedDeployments) {
        const firstSuccessDeploy = await prisma.deploymentAnalytics.findFirst({
            where: {
                repositoryId: repoId,
                status: "success",
                environment: failedDep.environment,
                createdAt: { gt: failedDep.createdAt }
            },
            orderBy: { createdAt: "asc" }
        });

        if (firstSuccessDeploy) {
            totalRecoveryTimeMs += (firstSuccessDeploy.createdAt.getTime() - failedDep.createdAt.getTime());
            recoveryCount++;
        }
    }

    const mttrHours = recoveryCount === 0 
        ? 0 
        : Number((totalRecoveryTimeMs / (1000 * 60 * 60 * recoveryCount)).toFixed(2));

    // Build success and deployment success rate from metrics for backward compatibility or display
    const metrics = await prisma.repositoryMetrics.findUnique({
        where: { repositoryId: repoId }
    }) || { totalBuilds: 0, successfulBuilds: 0, deploymentCount: 0, successfulDeployments: 0 };

    const buildSuccessRate = metrics.totalBuilds === 0 ? 0 : Number(((metrics.successfulBuilds / metrics.totalBuilds) * 100).toFixed(2));
    const deploymentSuccessRate = metrics.deploymentCount === 0 ? 0 : Number(((metrics.successfulDeployments / metrics.deploymentCount) * 100).toFixed(2));

    return {
        deploymentFrequency: successfulDeploymentsCount,
        deploymentFrequencyRating,
        changeFailureRate,
        leadTime: leadTimeHours,
        mttr: mttrHours,
        buildSuccessRate,
        deploymentSuccessRate
    };
};

module.exports = {
    getRepositoryDoraMetrics
};