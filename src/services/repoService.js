const prisma = require("../config/prisma")
const { Membership, orgexists } = require("../utils/repoutils")
const createRepository = async(userId, orgId, repoData) => {
     await orgexists(orgId)
    await Membership(userId, orgId)
    const repository = await prisma.repository.create({
        data: {
            name: repoData.name,
            organizationId: Number(orgId)
        }
    })
    return repository
}

const getOrganizationRepositories = async(userId, orgId) => {
    await Membership(userId, orgId)
    await orgexists(orgId)
    const repositories = await prisma.repository.findMany({
        where: {
            organizationId: Number(orgId)
        }
    })
    return repositories
}
const getRepositoryById = async (
    userId,
    repoId
) => {

    const repository =
        await prisma.repository.findUnique({
            where: {
                id: Number(repoId)
            }
        });

    if (!repository) {
        throw new Error(
            "Repository not found"
        );
    }

    await Membership(
        userId,
        repository.organizationId
    );

    return repository;
};

const deleteRepository = async (
    userId,
    repoId) => {

    const repository =
        await prisma.repository.findUnique({
            where: {
                id: Number(repoId)
            }
        });

    if (!repository) {
        throw new Error(
            "Repository not found"
        );
    }

    await Membership(
        userId,
        repository.organizationId
    );

    return prisma.repository.delete({
        where: {
            id: Number(repoId)
        }
    });
};

const getRepositoryByGithuhbId = async (githubRepoId) => {
    const repository = await prisma.repository.findUnique({
        where: {
            githubRepoId: String(githubRepoId)
        }
    });
    return repository;
};

const compareRepositories = async (userId, repoAId, repoBId) => {
    const { getRepositoryMetrics } = require("./metricsService");
    const { getRepositoryDoraMetrics } = require("./doraService");
    const { getRepositoryHealth } = require("./healthService");
    const { getRepositoryPRBottlenecks } = require("./prAnalyticsService");

    const repoA = await getRepositoryById(userId, repoAId);
    const repoB = await getRepositoryById(userId, repoBId);

    const [metricsA, metricsB, doraA, doraB, bottlenecksA, bottlenecksB] = await Promise.all([
        getRepositoryMetrics(repoAId),
        getRepositoryMetrics(repoBId),
        getRepositoryDoraMetrics(repoAId),
        getRepositoryDoraMetrics(repoBId),
        getRepositoryPRBottlenecks(repoAId),
        getRepositoryPRBottlenecks(repoBId)
    ]);

    const [healthA, healthB] = await Promise.all([
        getRepositoryHealth(repoAId),
        getRepositoryHealth(repoBId)
    ]);

    const issueResolutionRateA = metricsA.issueOpenedCount === 0 
        ? 100 
        : Number(((metricsA.issueClosedCount / metricsA.issueOpenedCount) * 100).toFixed(2));
    
    const issueResolutionRateB = metricsB.issueOpenedCount === 0 
        ? 100 
        : Number(((metricsB.issueClosedCount / metricsB.issueOpenedCount) * 100).toFixed(2));

    return {
        repoA: {
            id: repoA.id,
            name: repoA.name,
            healthScore: healthA.score,
            deploymentFrequency: doraA.deploymentFrequency,
            buildSuccessRate: doraA.buildSuccessRate,
            prVelocity: bottlenecksA.averageMergeTime,
            issueResolutionRate: issueResolutionRateA
        },
        repoB: {
            id: repoB.id,
            name: repoB.name,
            healthScore: healthB.score,
            deploymentFrequency: doraB.deploymentFrequency,
            buildSuccessRate: doraB.buildSuccessRate,
            prVelocity: bottlenecksB.averageMergeTime,
            issueResolutionRate: issueResolutionRateB
        }
    };
};

module.exports = {
    createRepository,
    getOrganizationRepositories,
    getRepositoryById,
    deleteRepository,
    getRepositoryByGithuhbId,
    compareRepositories
}