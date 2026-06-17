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
        return await metricsService.getRepositoryMetrics(repositoryId);
    } catch (error) {
        throw new Error(`Failed to retrieve metrics for repository ${repositoryId}: ${error.message}`);
    }
}
   
module.exports = {
    getRepositoryMetrics
};  