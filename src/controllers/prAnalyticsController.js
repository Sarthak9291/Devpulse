const prAnalyticsService = require("../services/prAnalyticsService");
const repoService = require("../services/repoService");

const getRepositoryPRBottlenecks = async (req, res) => {
    try {
        const repositoryId = Number(req.params.repositoryId);
        const userId = req.user.id;

        if (isNaN(repositoryId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid repository id"
            });
        }

        // Verify repository access
        await repoService.getRepositoryById(userId, repositoryId);

        const bottlenecks = await prAnalyticsService.getRepositoryPRBottlenecks(repositoryId);

        return res.status(200).json({
            success: true,
            message: "PR bottlenecks retrieved successfully",
            data: bottlenecks
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getRepositoryPRBottlenecks
};
