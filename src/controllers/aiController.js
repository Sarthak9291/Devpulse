const aiService = require("../services/aiService");
const repoService = require("../services/repoService");
const { Membership, orgexists } = require("../utils/repoutils");

const getRepositorySummary = async (req, res) => {
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

        const summary = await aiService.generateRepositorySummary(repositoryId);

        return res.status(200).json({
            success: true,
            message: "Repository AI summary generated successfully",
            data: summary
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const getOrganizationSummary = async (req, res) => {
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

        const summary = await aiService.generateOrganizationSummary(orgId);

        return res.status(200).json({
            success: true,
            message: "Organization AI summary generated successfully",
            data: summary
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = {
    getRepositorySummary,
    getOrganizationSummary
};
