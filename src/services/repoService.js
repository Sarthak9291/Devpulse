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

module.exports = {
    createRepository,
    getOrganizationRepositories,
    getRepositoryById,
    deleteRepository
}