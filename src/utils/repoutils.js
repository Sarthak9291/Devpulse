const prisma = require("../config/prisma");

const Membership = async (userId, orgId) => {
    const membership =
        await prisma.organizationMember.findUnique({
            where: {
                userId_organizationId: {
                    userId,
                    organizationId: Number(orgId)
                }
            }
        });

    if (!membership) {
        throw new Error(
            "You are not a member of this organization"
        );
    }
};

const orgexists = async (orgId) => {
    const organization =
        await prisma.organization.findUnique({
            where: {
                id: Number(orgId)
            }
        });

    if (!organization) {
        throw new Error("Organization not found");
    }
};

module.exports = {
    Membership,
    orgexists
};