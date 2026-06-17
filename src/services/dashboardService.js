const prisma = require("../config/prisma");
const  getRepositoryById = require("./repoService").getRepositoryById;
const getRepositoryMetrics = require("./metricsService").getRepositoryMetrics;
const getRepositoryActivities = require("./activityService").getRepositoryActivities;

const getRepositoryDashboard=async(userid,repositoryId)=>{
    const [repository,metrics,activities] = await Promise.all([
       getRepositoryById(userid,repositoryId),
       getRepositoryMetrics(repositoryId),
       getRepositoryActivities(repositoryId)
    ])
    return {
        repository,
        metrics,
        recentActivities:
            activities.slice(0, 10)
    };
}

module.exports = {
    getRepositoryDashboard
};