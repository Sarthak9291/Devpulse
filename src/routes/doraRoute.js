const express = require("express");
const router = express.Router();
const doraController = require("../controllers/doraController");
const cache = require("../middleware/cacheMiddleware");

router.get(
   "/:repositoryId",
   cache(300),
   doraController.getRepositoryDoraMetrics
);

module.exports = router;