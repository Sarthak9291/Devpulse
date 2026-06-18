const prisma = require('../config/prisma');
const updateMetrics = async (repositoryId, eventType,action,payload) => {
    if (eventType === "push") {
        await prisma.repositoryMetrics.upsert({
            where: { repositoryId },
            update: { pushCount: { increment: 1 } },
            create: { repositoryId, pushCount: 1 }
        });
    }
    else if (eventType === "pull_request") {
        if(action === "opened") {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { prOpenedCount: { increment: 1 } },
                create: { repositoryId, prOpenedCount: 1 }
            });
        }
        else if(action === "closed" && payload.pull_request?.merged) {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { prMergedCount: { increment: 1 } },
                create: { repositoryId, prMergedCount: 1 }
            });
        }
    }
    else if(eventType === "issues") {
        if(action === "opened") {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { issueOpenedCount: { increment: 1 } },
                create: { repositoryId, issueOpenedCount: 1 }
            });
        }
        else if(action === "closed") {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { issueClosedCount: { increment: 1 } },
                create: { repositoryId, issueClosedCount: 1 }
            });
        }
        }
    else if(eventType === "workflow_run") {
        await prisma.repositoryMetrics.upsert({
            where: { repositoryId },
            update: { totalBuilds: { increment: 1 } },
            create: { repositoryId, totalBuilds: 1 }
        });
        const status = payload.workflow_run?.conclusion;
        if(status === "success") {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { successfulBuilds: { increment: 1 } },
                create: { repositoryId, successfulBuilds: 1 }
            });
        }
        else if(status === "failure") {
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { failedBuilds: { increment: 1 } },
                create: { repositoryId, failedBuilds: 1 }
            });
        }
    }
    else if(eventType === "deployment"){
        await prisma.repositoryMetrics.upsert({
            where: { repositoryId },
            update: {
                deploymentCount:{increment: 1}
            },
            create: { repositoryId, deploymentCount: 1 }
        });
    }
    else if(eventType === "deployment_status"){
        const status = payload.deployment_status?.state;
        if(status === "success"){
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { successfulDeployments: { increment: 1 } },
                create: { repositoryId, successfulDeployments: 1 }
            });
        }
        else if(status === "failure"){
            await prisma.repositoryMetrics.upsert({
                where: { repositoryId },
                update: { failedDeployments: { increment: 1 } },
                create: { repositoryId, failedDeployments: 1 }
            });
        }
    }
    else if(eventType === "release"){
        await prisma.repositoryMetrics.upsert({
            where: { repositoryId },
            update: {
                releaseCount:{increment: 1}
            },
            create: { repositoryId, releaseCount: 1 }
        });
    }
};
const getRepositoryMetrics = async (repositoryId) => {
    const metrics = await prisma.repositoryMetrics.findUnique({
        where: { repositoryId },
        select:{
            pushCount: true,
            prOpenedCount: true,
            prMergedCount: true,
            issueOpenedCount: true,
            issueClosedCount: true,
            totalBuilds: true,
            successfulBuilds: true,
            failedBuilds: true,
            deploymentCount: true,
            successfulDeployments: true,
            failedDeployments: true,
            releaseCount: true
        }
    });

    return metrics || {
        pushCount: 0,
        prOpenedCount: 0,
        prMergedCount: 0,
        issueOpenedCount: 0,
        issueClosedCount: 0,
        totalBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        deploymentCount: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        releaseCount: 0
    };
};

module.exports = {
    updateMetrics,
    getRepositoryMetrics
};