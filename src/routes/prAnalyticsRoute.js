const express = require("express");
const router = express.Router();
const prAnalyticsController = require("../controllers/prAnalyticsController");
const cache = require("../middleware/cacheMiddleware");

router.get("/:repositoryId/bottlenecks", cache(300), prAnalyticsController.getRepositoryPRBottlenecks);

module.exports = router;
