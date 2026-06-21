const prisma = require("../config/prisma");
const { getRepositoryHealth } = require("./healthService");

const getOrganizationAnalytics = async (orgId) => {
    const organizationId = Number(orgId);

    // Get all repositories for the organization
    const repos = await prisma.repository.findMany({
        where: { organizationId }
    });

    if (repos.length === 0) {
        return {
            totalRepositories: 0,
            totalPRs: 0,
            totalIssues: 0,
            totalBuilds: 0,
            totalDeployments: 0,
            mostActiveRepository: null,
            mostActiveContributor: null,
            organizationHealthScore: 100
        };
    }

    const repoIds = repos.map(r => r.id);

    // Get repository metrics
    const metricsList = await prisma.repositoryMetrics.findMany({
        where: { repositoryId: { in: repoIds } }
    });

    const metricsMap = new Map(metricsList.map(m => [m.repositoryId, m]));

    let totalPRs = 0;
    let totalIssues = 0;
    let totalBuilds = 0;
    let totalDeployments = 0;
    let totalHealthScore = 0;

    let mostActiveRepo = null;
    let maxActivityVolume = -1;

    for (const repo of repos) {
        const metrics = metricsMap.get(repo.id) || {
            pushCount: 0,
            prOpenedCount: 0,
            issueOpenedCount: 0,
            totalBuilds: 0,
            deploymentCount: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            successfulBuilds: 0
        };

        totalPRs += metrics.prOpenedCount || 0;
        totalIssues += metrics.issueOpenedCount || 0;
        totalBuilds += metrics.totalBuilds || 0;
        totalDeployments += metrics.deploymentCount || 0;

        // Health Score
        const health = await getRepositoryHealth(repo.id);
        totalHealthScore += health.score;

        // Activity volume: push + PR + Build + Deployment
        const activityVolume = (metrics.pushCount || 0) + 
                               (metrics.prOpenedCount || 0) + 
                               (metrics.totalBuilds || 0) + 
                               (metrics.deploymentCount || 0);

        if (activityVolume > maxActivityVolume) {
            maxActivityVolume = activityVolume;
            mostActiveRepo = {
                id: repo.id,
                name: repo.name,
                activityVolume
            };
        }
    }

    const averageHealthScore = Math.round(totalHealthScore / repos.length);

    // Most active contributor from WebhookEvent
    const activeSenders = await prisma.webhookEvent.groupBy({
        by: ['sender'],
        where: {
            repositoryId: { in: repoIds },
            sender: { not: null }
        },
        _count: {
            sender: true
        },
        orderBy: {
            _count: {
                sender: 'desc'
            }
        },
        take: 1
    });

    const mostActiveContributor = activeSenders.length > 0 ? {
        username: activeSenders[0].sender,
        eventCount: activeSenders[0]._count.sender
    } : null;

    return {
        totalRepositories: repos.length,
        totalPRs,
        totalIssues,
        totalBuilds,
        totalDeployments,
        mostActiveRepository: mostActiveRepo,
        mostActiveContributor,
        organizationHealthScore: averageHealthScore
    };
};

module.exports = {
    getOrganizationAnalytics
};
