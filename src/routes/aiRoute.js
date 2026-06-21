const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

router.get("/repository/:repositoryId", aiController.getRepositorySummary);
router.get("/organization/:orgId", aiController.getOrganizationSummary);

module.exports = router;
