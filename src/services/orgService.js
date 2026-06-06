const prisma = require('../config/prisma');

const createOrganization = async (orgData, userId) => {
    const { name } = orgData;

    const inviteCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const organization = await prisma.organization.create({
        data: {
            name,
            inviteCode
        }
    });

    await prisma.organizationMember.create({
        data: {
            userId,
            organizationId: organization.id
        }
    });

    return organization;
};

const joinOrganization = async (inviteCode, userId) => {
    const organization = await prisma.organization.findUnique({
        where: {
            inviteCode
        }
    });

    if (!organization) {
        throw new Error('Invalid invite code');
    }

    const existingMembership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: organization.id
                }
            }
        });

    if (existingMembership) {
        throw new Error(
            'User is already a member of this organization'
        );
    }

    await prisma.organizationMember.create({
        data: {
            userId,
            organizationId: organization.id
        }
    });

    return organization;
};

const getMyOrganizations = async (userId) => {
    return prisma.organization.findMany({
        where: {
            memberships: {
                some: {
                    userId
                }
            }
        }
    });
};

const getOrganizationById = async (
    userId,
    organizationId
) => {
    const organization =
        await prisma.organization.findFirst({
            where: {
                id: Number(organizationId),
                memberships: {
                    some: {
                        userId
                    }
                }
            }
        });

    if (!organization) {
        throw new Error(
            'Organization not found or access denied'
        );
    }

    return organization;
};

const getOrganizationMembers = async (
    requesterId,
    organizationId
) => {
    const orgId = Number(organizationId);

    const membership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId: requesterId,
                    organizationId: orgId
                }
            }
        });

    if (!membership) {
        throw new Error(
            'Forbidden: requester is not a member of this organization'
        );
    }

    return prisma.user.findMany({
        where: {
            memberships: {
                some: {
                    organizationId: orgId
                }
            }
        },
        select: {
            id: true,
            email: true,
            createdAt: true
        }
    });
};

const leaveOrganization = async (
    userId,
    organizationId
) => {
    return prisma.organizationMember.delete({
        where: {
            userId_organizationId: {
                userId,
                organizationId: Number(organizationId)
            }
        }
    });
};


module.exports = {
    createOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationById,
    getOrganizationMembers,
    leaveOrganization
};