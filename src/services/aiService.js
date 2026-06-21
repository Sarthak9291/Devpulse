const prisma = require("../config/prisma");
const metricsService = require("./metricsService");
const doraService = require("./doraService");
const orgAnalyticsService = require("./orgAnalyticsService");

const generateRepositorySummary = async (repositoryId) => {
    const repoId = Number(repositoryId);
    
    const repository = await prisma.repository.findUnique({
        where: { id: repoId }
    });
    
    if (!repository) {
        throw new Error("Repository not found");
    }

    const metrics = await metricsService.getRepositoryMetrics(repoId);
    const dora = await doraService.getRepositoryDoraMetrics(repoId);
    
    // Fetch activities for the past 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivities = await prisma.activity.findMany({
        where: {
            repositoryId: repoId,
            createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { createdAt: 'desc' }
    });

    const pushActivities = recentActivities.filter(a => a.eventType === 'push');
    const prActivities = recentActivities.filter(a => a.eventType === 'pull_request');
    const buildActivities = recentActivities.filter(a => a.eventType === 'workflow_run');
    const deployActivities = recentActivities.filter(a => a.eventType === 'deployment' || a.eventType === 'deployment_status');

    let summaryMarkdown = `# AI Weekly Summary for **${repository.name}**\n\n`;
    summaryMarkdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
    
    summaryMarkdown += `## 📊 Weekly Highlights\n`;
    summaryMarkdown += `This week: **${pushActivities.length}** pushes, **${prActivities.length}** PR updates, **${buildActivities.length}** builds, and **${deployActivities.length}** deployments were processed.\n\n`;

    summaryMarkdown += `## 🚀 DORA Metrics\n`;
    summaryMarkdown += `- **Deployment Frequency**: ${dora.deploymentFrequency} deployments (last 30 days) - Rating: **${dora.deploymentFrequencyRating}**\n`;
    summaryMarkdown += `- **Change Failure Rate**: ${dora.changeFailureRate}%\n`;
    summaryMarkdown += `- **Lead Time for Changes**: ${dora.leadTime} hours\n`;
    summaryMarkdown += `- **Mean Time to Recovery (MTTR)**: ${dora.mttr} hours\n\n`;

    summaryMarkdown += `## 🛠️ Build & Reliability\n`;
    summaryMarkdown += `- **Build Success Rate**: ${dora.buildSuccessRate}%\n`;
    summaryMarkdown += `- **Deployment Success Rate**: ${dora.deploymentSuccessRate}%\n`;
    summaryMarkdown += `- **Total Cumulative Builds**: ${metrics.totalBuilds} (${metrics.successfulBuilds} successful, ${metrics.failedBuilds} failed)\n\n`;

    summaryMarkdown += `## 🧠 Key Insights & Recommendations\n`;
    
    const insights = [];
    if (dora.changeFailureRate > 20) {
        insights.push("⚠️ **High Change Failure Rate**: Deployments have a high failure rate. Consider introducing extra tests before production rollout.");
    } else {
        insights.push("✅ **Excellent Stability**: Your deployment change failure rate is low and healthy.");
    }

    if (dora.leadTime > 24) {
        insights.push("⏳ **Slow PR Turnaround**: Average lead time is high. Consider encouraging smaller pull requests to streamline code reviews.");
    }

    if (dora.buildSuccessRate < 80) {
        insights.push("🚨 **Build Instability**: Build success rate is below 80%. Inspect CI pipelines for flaky tests or setup configurations.");
    }
    
    if (insights.length === 0) {
        insights.push("✨ Keep up the great work! All health indicators are looking solid.");
    }

    summaryMarkdown += insights.map(i => `- ${i}`).join('\n') + '\n';

    return {
        repositoryName: repository.name,
        summary: summaryMarkdown
    };
};

const generateOrganizationSummary = async (orgId) => {
    const organizationId = Number(orgId);
    
    const org = await prisma.organization.findUnique({
        where: { id: organizationId }
    });

    if (!org) {
        throw new Error("Organization not found");
    }

    const analytics = await orgAnalyticsService.getOrganizationAnalytics(organizationId);

    let summaryMarkdown = `# AI Executive Weekly Summary for **${org.name}**\n\n`;
    summaryMarkdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;

    summaryMarkdown += `## 🏢 Organizational Overview\n`;
    summaryMarkdown += `- **Total Repositories**: ${analytics.totalRepositories}\n`;
    summaryMarkdown += `- **Organization Health Score**: **${analytics.organizationHealthScore}/100**\n\n`;

    summaryMarkdown += `## 📈 Engineering Activity Volume\n`;
    summaryMarkdown += `- **Total Pull Requests**: ${analytics.totalPRs}\n`;
    summaryMarkdown += `- **Total Issues**: ${analytics.totalIssues}\n`;
    summaryMarkdown += `- **Total Builds**: ${analytics.totalBuilds}\n`;
    summaryMarkdown += `- **Total Deployments**: ${analytics.totalDeployments}\n\n`;

    if (analytics.mostActiveRepository) {
        summaryMarkdown += `## 🏆 Most Active Repository\n`;
        summaryMarkdown += `- **${analytics.mostActiveRepository.name}** with **${analytics.mostActiveRepository.activityVolume}** total activities.\n\n`;
    }

    if (analytics.mostActiveContributor) {
        summaryMarkdown += `## 👤 Most Active Contributor\n`;
        summaryMarkdown += `- **@${analytics.mostActiveContributor.username}** with **${analytics.mostActiveContributor.eventCount}** webhook events contributed.\n\n`;
    }

    summaryMarkdown += `## 💡 Recommendations\n`;
    
    const insights = [];
    if (analytics.organizationHealthScore < 70) {
        insights.push("⚠️ **Organization Health Drop**: Average health score is low. Review repositories marked with critical health status.");
    } else {
        insights.push("🚀 **High Engineering Velocity**: Organization health is in good shape. Maintain current quality standards.");
    }

    if (analytics.totalIssues > analytics.totalPRs * 1.5) {
        insights.push("📋 **Backlog Growth**: The number of open issues is growing faster than PRs are being merged. Plan a bug-smashing session.");
    }

    if (insights.length === 0) {
        insights.push("✨ Keep up the great work! All organizational metrics are stable.");
    }

    summaryMarkdown += insights.map(i => `- ${i}`).join('\n') + '\n';

    return {
        organizationName: org.name,
        summary: summaryMarkdown
    };
};

module.exports = {
    generateRepositorySummary,
    generateOrganizationSummary
};
