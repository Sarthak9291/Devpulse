const orgService = require('../services/orgService');

const createOrganization = async (req, res, next) => {
    try {

        const organization =
            await orgService.createOrganization(
                req.body,
                req.user.id
            );

        res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: organization
        });

    } catch (error) {

        next(error);
    }
};

const joinOrganization = async (req, res,next) => {
    try{
        const organization = await orgService.joinOrganization(
            req.body.inviteCode,
            req.user.id
        );
        res.status(200).json({
            success: true,
            message: "Joined organization successfully",
            data: organization
        });
    } catch (error) {
        next(error);
    }
};
const getMyOrganizations = async (req, res) => {
    try{
        const organizations = await orgService.getMyOrganizations(req.user.id);
        res.status(200).json({
            success: true,
            message: "Organizations retrieved successfully",
            data: organizations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve organizations",
            error: error.message
        });
    }
}

const getOrganizationMembers = async (req, res) => {
    try{
        const members= await orgService.getOrganizationMembers(req.user.id,req.params.orgId)
        res.status(200).json({
            success: true,
            message: "Members retrieved successfully",
            data: members
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve members",
            error: error.message
        });
    }
}
const leaveOrganization = async (req, res) => {
    try{
        await orgService.leaveOrganization(req.user.id,req.params.orgId)
        res.status(200).json({
            success: true,
            message: "Left organization successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to leave organization",
            error: error.message
        });
    }
}
const getOrganizationById = async (req, res) => {
    try{
        const organization = await orgService.getOrganizationById(req.user.id, req.params.orgId);
        res.status(200).json({
            success: true,
            message: "Organization retrieved successfully",
            data: organization
        });
    } catch (error) {
        res.status(500).json({
            success: false, 
            message: "Failed to retrieve organization",
            error: error.message
        });
    }

}
module.exports = {
    createOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationById,
    getOrganizationMembers,
    leaveOrganization
};
