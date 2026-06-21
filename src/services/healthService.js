const prisma = require("../config/prisma");

const getRepositoryHealth = async (repositoryId) => {
    // Require services locally to prevent circular dependencies
    const doraService = require("./doraService");
    const metricsService = require("./metricsService");
    const repoId = Number(repositoryId);
    
    // Fetch metrics and DORA metrics
    const [metrics, dora] = await Promise.all([
        metricsService.getRepositoryMetrics(repoId),
        doraService.getRepositoryDoraMetrics(repoId)
    ]);
    
    // 1. Build Success Score (20% weight)
    const buildSuccessRate = dora.buildSuccessRate || 0;
    const buildScore = buildSuccessRate;
    
    // 2. Deployment Success Score (20% weight)
    const deploymentSuccessRate = dora.deploymentSuccessRate || 0;
    const deploymentScore = deploymentSuccessRate;
    
    // 3. DORA Score (30% weight)
    // - Deployment Frequency Rating: Elite = 100, High = 85, Medium = 70, Low = 50
    // - Change Failure Rate: < 15% = 100, < 25% = 75, < 40% = 50, else 0
    // - Lead Time: < 6h = 100, < 24h = 80, < 72h = 60, else 40
    // - MTTR: < 4h = 100, < 24h = 80, < 48h = 60, else 40
    let dfScore = 50;
    if (dora.deploymentFrequencyRating === "Elite") dfScore = 100;
    else if (dora.deploymentFrequencyRating === "High") dfScore = 85;
    else if (dora.deploymentFrequencyRating === "Medium") dfScore = 70;
    
    let cfrScore = 0;
    if (dora.changeFailureRate < 15) cfrScore = 100;
    else if (dora.changeFailureRate < 25) cfrScore = 75;
    else if (dora.changeFailureRate < 40) cfrScore = 50;
    
    let ltScore = 40;
    if (dora.leadTime === 0) ltScore = 100; // no lead time recorded is neutral/perfect
    else if (dora.leadTime < 6) ltScore = 100;
    else if (dora.leadTime < 24) ltScore = 80;
    else if (dora.leadTime < 72) ltScore = 60;
    
    let mttrScore = 40;
    if (dora.mttr === 0) mttrScore = 100; // no failed deployments means 100
    else if (dora.mttr < 4) mttrScore = 100;
    else if (dora.mttr < 24) mttrScore = 80;
    else if (dora.mttr < 48) mttrScore = 60;
    
    const doraScore = (dfScore + cfrScore + ltScore + mttrScore) / 4;
    
    // 4. Issue Resolution Rate (15% weight)
    const issueOpened = metrics.issueOpenedCount || 0;
    const issueClosed = metrics.issueClosedCount || 0;
    const issueResolutionRate = issueOpened === 0 ? 100 : (issueClosed / issueOpened) * 100;
    const issueScore = issueResolutionRate;
    
    // 5. Activity Score (15% weight)
    const activityScore = metrics.pushCount > 20 ? 100 : metrics.pushCount * 5;
    
    // Total weighted health score
    const healthScore = Math.round(
        buildScore * 0.20 +
        deploymentScore * 0.20 +
        doraScore * 0.30 +
        issueScore * 0.15 +
        activityScore * 0.15
    );
    
    let status;
    if (healthScore >= 80) {
        status = "Healthy";
    } else if (healthScore >= 60) {
        status = "Warning";
    } else {
        status = "Critical";
    }
    
    // Reasons list
    const reasons = [];
    if (buildSuccessRate >= 90) {
        reasons.push("Excellent CI/CD build success rate");
    } else if (buildSuccessRate < 70) {
        reasons.push("CI/CD pipeline builds are frequently failing");
    }
    
    if (deploymentSuccessRate >= 95) {
        reasons.push("Excellent deployment reliability");
    } else if (deploymentSuccessRate < 80) {
        reasons.push("High deployment failure rate detected");
    }
    
    if (dora.leadTime > 0 && dora.leadTime < 6) {
        reasons.push("Lead time for changes is below 6 hours");
    } else if (dora.leadTime > 48) {
        reasons.push("Long lead time for changes (above 48 hours)");
    }
    
    if (dora.mttr > 0 && dora.mttr < 4) {
        reasons.push("Very fast mean time to recovery (MTTR)");
    } else if (dora.mttr > 24) {
        reasons.push("Slow recovery from deployment failures (MTTR > 24 hours)");
    }
    
    if (issueOpened > 0 && issueResolutionRate > 90) {
        reasons.push("Outstanding issue resolution velocity");
    } else if (issueOpened > 0 && issueResolutionRate < 50) {
        reasons.push("High volume of unresolved issues");
    }
    
    if (metrics.pushCount > 30) {
        reasons.push("Active code commits and pushes");
    } else if (metrics.pushCount < 5) {
        reasons.push("Low repository update activity");
    }
    
    if (reasons.length === 0) {
        reasons.push("Stable and consistent performance indicators");
    }
    
    return {
        score: healthScore,
        status,
        buildScore: Math.round(buildScore),
        deploymentScore: Math.round(deploymentScore),
        activityScore: Math.round(activityScore),
        doraScore: Math.round(doraScore),
        issueScore: Math.round(issueScore),
        reasons
    };
};

module.exports = {
    getRepositoryHealth
};