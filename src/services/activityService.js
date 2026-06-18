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
    else if(eventType==="workflow_run"){
        const repositoryName = payload.repository?.name;
        const workflowName = payload.workflow_run?.name;
        const workflowStatus = payload.workflow_run?.conclusion;
        const conclusion = payload.workflow_run?.conclusion;
        title = `${sender} workflow ${workflowName} in ${repositoryName} concluded with status: ${workflowStatus}`;
        description = `Workflow ${workflowName} in ${repositoryName} concluded with status: ${conclusion}`;
    }
    else if(eventType==="check_run"){
        const repositoryName = payload.repository?.name;
        const checkName = payload.check_run?.name;
        const checkStatus = payload.check_run?.conclusion;
        const conclusion = payload.check_run?.conclusion;
        title = `${sender} check ${checkName} in ${repositoryName} concluded with status: ${checkStatus}`;
        description = `Check ${checkName} in ${repositoryName} concluded with status: ${conclusion}`;
    }
    else if(eventType==="deployment"){
        const repositoryName = payload.repository?.name;
        const environment = payload.deployment?.environment;
        const deploymentStatus = payload.deployment?.state;
        title = `${sender} deployed to ${environment} in ${repositoryName} with status: ${deploymentStatus}`;
        description = `Deployment to ${environment} in ${repositoryName} has status: ${deploymentStatus}`;
    }
    else if(eventType==="deployment_status"){
        const repositoryName = payload.repository?.name;
        const environment = payload.deployment?.environment;
        const deploymentStatus = payload.deployment_status?.state;
        title = `${sender} deployment to ${environment} in ${repositoryName} updated with status: ${deploymentStatus}`;
        description = `Deployment to ${environment} in ${repositoryName} has updated status: ${deploymentStatus}`;
    }
    else if (eventType==="release"){
        const repositoryName = payload.repository?.name;
        const releaseName = payload.release?.name;
        const releaseAction = payload.action;
        title = `${sender} ${releaseAction} release ${releaseName} in ${repositoryName}`;
        description = `Release ${releaseName} in ${repositoryName} was ${releaseAction}`;
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