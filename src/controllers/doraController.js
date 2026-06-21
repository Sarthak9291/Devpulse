const doraService = require("../services/doraService");
const repoService = require("../services/repoService");

const getRepositoryDoraMetrics = async (req, res) => {
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

        const metrics = await doraService.getRepositoryDoraMetrics(repositoryId);

        return res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getRepositoryDoraMetrics
};