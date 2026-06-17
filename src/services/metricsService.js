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
}

const getRepositoryMetrics = async (repositoryId) => {
    return prisma.repositoryMetrics.findUnique({
        where: { repositoryId },
        select:{
            pushCount: true,
            prOpenedCount: true,
            prMergedCount: true,
            issueOpenedCount: true,
            issueClosedCount: true
        }
    });
};

module.exports = {
    updateMetrics,
    getRepositoryMetrics
};