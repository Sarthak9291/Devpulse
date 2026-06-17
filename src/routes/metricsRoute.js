const express = require("express");
const router = express.Router();
const { getRepositoryMetrics } = require("../controllers/metricController");

router.get("/:repositoryId", getRepositoryMetrics);

module.exports = router;