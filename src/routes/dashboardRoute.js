const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
router.get('/repository/:repositoryId', dashboardController.getRepositoryDashboard);
module.exports = router;