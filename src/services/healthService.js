const getRepositoryHealth = (metrics) => {
    const safeMetrics = metrics || {
        pushCount: 0,
        totalBuilds: 0,
        successfulBuilds: 0,
        deploymentCount: 0,
        successfulDeployments: 0
    };

    const buildScore =
        safeMetrics.totalBuilds > 0
            ? (safeMetrics.successfulBuilds / safeMetrics.totalBuilds) * 100
            : 100;

    const deploymentScore =
        safeMetrics.deploymentCount > 0
            ? (safeMetrics.successfulDeployments / safeMetrics.deploymentCount) * 100
            : 100;

    const activityScore =
        safeMetrics.pushCount > 20
            ? 100
            : safeMetrics.pushCount * 5;

    const healthScore = Math.round(
        buildScore * 0.4 +
        deploymentScore * 0.4 +
        activityScore * 0.2
    );

    let status;

    if (healthScore >= 80) {
        status = "Healthy";
    }
    else if (healthScore >= 60) {
        status = "Warning";
    }
    else {
        status = "Critical";
    }

    return {
        score: healthScore,
        status,
        buildScore: Math.round(buildScore),
        deploymentScore: Math.round(deploymentScore),
        activityScore: Math.round(activityScore)
    };
};

module.exports = {
    getRepositoryHealth
};