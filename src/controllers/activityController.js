const activityService = require('../services/activityService');

const getRepositoryActivities = async (req, res) => {
    try{
        const repositoryId = Number(req.params.repositoryId);
        if (isNaN(repositoryId)) {
         return res.status(400).json({
        success: false,
        message: "Invalid repository id"
        });
    }
        const activities = await activityService.getRepositoryActivities(repositoryId);
        
        res.status(200).json({
            success: true,
            message: "Repository activities retrieved successfully",
            data: activities
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getOrganizationActivities = async (req, res) => {
    try{
        const organizationId = Number(req.params.organizationId);
        if (isNaN(organizationId)) {
         return res.status(400).json({
        success: false,
        message: "Invalid organization id"
        });
        }
        const activities = await activityService.getOrganizationActivities(organizationId);
        res.status(200).json({
            success: true,
            message: "Organization activities retrieved successfully",
            data: activities
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getRepositoryActivities,
    getOrganizationActivities
};