const {
    createRepository,
    getOrganizationRepositories,
    getRepositoryById,
    deleteRepository,
    compareRepositories
} = require("../controllers/repoController");

const express = require("express");
const router = express.Router();

router.post("/organizations/:orgId/repositories", createRepository);
router.get("/organizations/:orgId/repositories", getOrganizationRepositories);
router.get("/compare", compareRepositories);
router.get("/:repoId", getRepositoryById);
router.delete("/:repoId", deleteRepository);

module.exports = router;