const repoService = require("../services/repoService")
const createRepository=async (req, res) => {
    try{
        const repository = await repoService.createRepository(req.user.id, req.params.orgId, req.body)
        res.status(201).json({
            success: true,
            message: "Repository created successfully",
            data: repository
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error creating repository",
            error: error.message
        });
    }
}

const getOrganizationRepositories=async (req, res) => {
    try{
        const repositories = await repoService.getOrganizationRepositories(req.user.id, req.params.orgId)
        res.status(200).json({
            success: true,
            message: "Repositories retrieved successfully",
            data: repositories
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error retrieving repositories",
            error: error.message
        });
    }
}

const getRepositoryById=async (req, res) => {
    const repositoryId = req.params.repoId

    try{
        const repository = await repoService.getRepositoryById(req.user.id, repositoryId)
        res.status(200).json({
            success: true,
            message: "Repository retrieved successfully",
            data: repository
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error retrieving repository",
            error: error.message
        });
    }
}
const deleteRepository=async (req, res) => {
    const repositoryId = req.params.repoId
    // const orgId = req.params.orgId
    try{
        const deletedRepository = await repoService.deleteRepository(req.user.id, repositoryId)
        res.status(200).json({
            success: true,
            message: "Repository deleted successfully",
            data: deletedRepository
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Error deleting repository",
            error: error.message
        });
    }
}
module.exports = {
    createRepository,
    getOrganizationRepositories,
    getRepositoryById,
    deleteRepository
}