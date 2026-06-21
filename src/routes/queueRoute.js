const express = require("express");
const router = express.Router();
const queueController = require("../controllers/queueController");

router.get("/metrics", queueController.getQueueMetrics);

module.exports = router;
