const dashboardService = require('../services/dashboardService');

const getRepositoryDashboard = async (req, res) => {
    try {
        const repositoryId = Number(req.params.repositoryId);
        const userid=req.user.id;
        if (isNaN(repositoryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid repository id"
            });
        }
        const dashboardData = await dashboardService.getRepositoryDashboard(userid, repositoryId);
        res.status(200).json({
            success: true,
            message: "Repository dashboard retrieved successfully",
            data: dashboardData
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getRepositoryDashboard
};