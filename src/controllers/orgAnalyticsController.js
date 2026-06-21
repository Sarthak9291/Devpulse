const orgAnalyticsService = require("../services/orgAnalyticsService");
const { Membership, orgexists } = require("../utils/repoutils");

const getOrganizationAnalytics = async (req, res) => {
    try {
        const orgId = Number(req.params.orgId);
        const userId = req.user.id;

        if (isNaN(orgId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid organization id"
            });
        }

        await orgexists(orgId);
        await Membership(userId, orgId);

        const analytics = await orgAnalyticsService.getOrganizationAnalytics(orgId);

        return res.status(200).json({
            success: true,
            message: "Organization analytics retrieved successfully",
            data: analytics
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getOrganizationAnalytics
};
