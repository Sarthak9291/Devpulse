const metricsService = require("../services/metricsService");

const getRepositoryMetrics = async (req,res) => {
    try{
        const repositoryId = Number(req.params.repositoryId);
        if (isNaN(repositoryId)) {
            return res.status(400).json({
                success: false, 
                message: "Invalid repository id"
            });
        }
        const metrics = await metricsService.getRepositoryMetrics(repositoryId);
        return res.status(200).json({
            success: true,
            data: metrics
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to retrieve metrics: ${error.message}`
        });
    }
}
   
module.exports = {
    getRepositoryMetrics
};  