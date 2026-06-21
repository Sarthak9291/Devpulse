const queueService = require("../services/queueService");

const getQueueMetrics = async (req, res) => {
    try {
        const metrics = await queueService.getQueueMetrics();
        res.status(200).json({
            success: true,
            message: "Queue metrics retrieved successfully",
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve queue metrics",
            error: error.message
        });
    }
};

module.exports = {
    getQueueMetrics
};
