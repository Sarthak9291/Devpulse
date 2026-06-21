const prisma = require("../config/prisma");

const createPullRequest = async (prData) => {
    const { repositoryId, githubPrId, openedAt } = prData;
    return await prisma.pullRequestAnalytics.upsert({
        where: { githubPrId },
        update: { openedAt },
        create: { repositoryId, githubPrId, openedAt }
    });
};

const mergePullRequest = async (githubPrId, mergedAt) => {
    return await prisma.pullRequestAnalytics.updateMany({
        where: { githubPrId },
        data: { mergedAt }
    });
};

const getRepositoryPullRequests = async (repositoryId) => {
    return await prisma.pullRequestAnalytics.findMany({
        where: { repositoryId: Number(repositoryId) },
        orderBy: { openedAt: "desc" }
    });
};

const handlePullRequestEvent = async (repositoryId, action, payload) => {
    const githubPrId = String(payload.pull_request.id);
    const openedAt = new Date(payload.pull_request.created_at);

    if (action === "opened" || action === "reopened") {
        await createPullRequest({
            repositoryId,
            githubPrId,
            openedAt
        });
    } else if (action === "closed" && payload.pull_request?.merged) {
        const mergedAt = new Date(payload.pull_request.merged_at);
        await prisma.pullRequestAnalytics.upsert({
            where: { githubPrId },
            update: { mergedAt },
            create: {
                repositoryId,
                githubPrId,
                openedAt,
                mergedAt
            }
        });
    }
};

const handlePullRequestReviewEvent = async (repositoryId, action, payload) => {
    if (action !== "submitted") return;
    const githubPrId = String(payload.pull_request.id);
    const submittedAt = new Date(payload.review.submitted_at);

    const pr = await prisma.pullRequestAnalytics.findUnique({
        where: { githubPrId }
    });

    if (pr) {
        if (!pr.firstReviewedAt) {
            const openedAt = new Date(pr.openedAt);
            const reviewDuration = Math.round((submittedAt - openedAt) / 1000); // duration in seconds
            await prisma.pullRequestAnalytics.update({
                where: { githubPrId },
                data: {
                    firstReviewedAt: submittedAt,
                    reviewDuration
                }
            });
        }
    } else {
        const openedAt = new Date(payload.pull_request.created_at);
        const reviewDuration = Math.round((submittedAt - openedAt) / 1000);
        await prisma.pullRequestAnalytics.create({
            data: {
                repositoryId,
                githubPrId,
                openedAt,
                firstReviewedAt: submittedAt,
                reviewDuration
            }
        });
    }
};

// Phase 2: PR Bottleneck Detection calculations
const getRepositoryPRBottlenecks = async (repositoryId) => {
    const prs = await prisma.pullRequestAnalytics.findMany({
        where: { repositoryId: Number(repositoryId) }
    });

    const mergedPRs = prs.filter(pr => pr.mergedAt !== null);
    const reviewedPRs = prs.filter(pr => pr.firstReviewedAt !== null);
    const openPRs = prs.filter(pr => pr.mergedAt === null);

    // 1. Average Merge Time (in hours)
    let averageMergeTime = 0;
    if (mergedPRs.length > 0) {
        const totalMergeTime = mergedPRs.reduce((sum, pr) => {
            const diffMs = new Date(pr.mergedAt) - new Date(pr.openedAt);
            return sum + (diffMs / (1000 * 60 * 60)); // convert to hours
        }, 0);
        averageMergeTime = Number((totalMergeTime / mergedPRs.length).toFixed(2));
    }

    // 2. Average Review Time (in hours)
    let averageReviewTime = 0;
    if (reviewedPRs.length > 0) {
        const totalReviewTime = reviewedPRs.reduce((sum, pr) => {
            const diffMs = new Date(pr.firstReviewedAt) - new Date(pr.openedAt);
            return sum + (diffMs / (1000 * 60 * 60)); // convert to hours
        }, 0);
        averageReviewTime = Number((totalReviewTime / reviewedPRs.length).toFixed(2));
    }

    // 3. Stale PR Detection (open for more than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const stalePRs = openPRs.filter(pr => new Date(pr.openedAt) < sevenDaysAgo).map(pr => ({
        id: pr.id,
        githubPrId: pr.githubPrId,
        openedAt: pr.openedAt,
        daysOpen: Math.round((new Date() - new Date(pr.openedAt)) / (1000 * 60 * 60 * 24))
    }));

    // 4. Longest Open PRs
    const longestOpenPRs = [...openPRs]
        .sort((a, b) => new Date(a.openedAt) - new Date(b.openedAt))
        .slice(0, 5)
        .map(pr => ({
            id: pr.id,
            githubPrId: pr.githubPrId,
            openedAt: pr.openedAt,
            daysOpen: Math.round((new Date() - new Date(pr.openedAt)) / (1000 * 60 * 60 * 24))
        }));

    return {
        averageMergeTime,
        averageReviewTime,
        stalePRCount: stalePRs.length,
        stalePRs,
        longestOpenPRs,
        totalPRCount: prs.length,
        openPRCount: openPRs.length,
        mergedPRCount: mergedPRs.length
    };
};

module.exports = {
    createPullRequest,
    mergePullRequest,
    getRepositoryPullRequests,
    handlePullRequestEvent,
    handlePullRequestReviewEvent,
    getRepositoryPRBottlenecks
};