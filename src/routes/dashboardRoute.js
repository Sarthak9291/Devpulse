const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const cache = require('../middleware/cacheMiddleware');

router.get('/repository/:repositoryId', cache(300), dashboardController.getRepositoryDashboard);
module.exports = router;