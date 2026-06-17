const prisma = require("../config/prisma");
const { Membership, orgexists } =require("../utils/repoUtils");
const createActivity = async (
    repositoryId,
    eventType,
    action,
    sender,
    payload
) => {
    let title;
    let description;

    if (eventType === "push") {
        const repositoryName = payload.repository?.name;
        const commitCount = payload.commits?.length || 0;
        const branch = payload.ref?.replace("refs/heads/", "");

        title = `${sender} pushed ${commitCount} commits to ${repositoryName}`;
        description = `Branch: ${branch}`;
    }

    else if (eventType === "pull_request") {
        const repositoryName = payload.repository?.name;
        const prNumber = payload.pull_request?.number;
        const prTitle = payload.pull_request?.title;

        title = `${sender} ${action} PR #${prNumber} in ${repositoryName}`;
        description = prTitle;
    }

    else if (eventType === "issues") {
        const repositoryName = payload.repository?.name;
        const issueNumber = payload.issue?.number;
        const issueTitle = payload.issue?.title;

        title = `${sender} ${action} Issue #${issueNumber} in ${repositoryName}`;
        description = issueTitle;
    }

    else {
        const repositoryName = payload.repository?.name;

        title = `${sender} triggered ${eventType} on ${repositoryName}`;
        description = null;
    }

    return prisma.activity.create({
        data: {
            repositoryId,
            eventType,
            title,
            description
        }
    });
};

const getRepositoryActivities = async (repositoryId) => {
    return await prisma.activity.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
        select: { id:true, eventType:true, title:true, description:true, createdAt:true },

    });

};
const getOrganizationActivities = async (organizationId) => {
    return await prisma.activity.findMany({
        where: {
            repository: {
                organizationId
            }
        },
        orderBy: { createdAt: 'desc' },
        select: { id:true, eventType:true, title:true, description:true, createdAt:true }
    });

};

module.exports = {
    createActivity,
    getRepositoryActivities,
    getOrganizationActivities
};