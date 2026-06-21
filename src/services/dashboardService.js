const prisma = require("../config/prisma");
const  getRepositoryById = require("./repoService").getRepositoryById;
const getRepositoryMetrics = require("./metricsService").getRepositoryMetrics;
const getRepositoryActivities = require("./activityService").getRepositoryActivities;
const getRepositoryHealth = require("./healthService").getRepositoryHealth;
const getRepositoryDashboard=async(userid,repositoryId)=>{
    const [repository,metrics,activities] = await Promise.all([
       getRepositoryById(userid,repositoryId),
       getRepositoryMetrics(repositoryId),
       getRepositoryActivities(repositoryId)
    ])
    const safeMetrics = metrics || {
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
    const buildSuccessRate =
    safeMetrics.totalBuilds > 0
        ? (
            safeMetrics.successfulBuilds
            /
            safeMetrics.totalBuilds
          ) * 100
        : 0;
        const deploymentSuccessRate =
    safeMetrics.deploymentCount > 0
        ? (
            safeMetrics.successfulDeployments /
            safeMetrics.deploymentCount
          ) * 100
        : 0;
    return {
        repository,
        metrics: safeMetrics,
        buildSuccessRate,
        deploymentSuccessRate,
        health: await getRepositoryHealth(repositoryId),
        recentActivities:
            activities.slice(0, 10)
    };
}

module.exports = {
    getRepositoryDashboard
};