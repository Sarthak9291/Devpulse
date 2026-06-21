const {
    createOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationById,
    getOrganizationMembers,
    leaveOrganization
} = require('../controllers/orgController');

const {
    getOrganizationAnalytics
} = require('../controllers/orgAnalyticsController');

const express = require('express');
const router = express.Router();

const cache = require('../middleware/cacheMiddleware');

router.post('/create', createOrganization);
router.post('/join', joinOrganization);
router.get('/getorganizations', getMyOrganizations);
router.get('/:orgId', getOrganizationById);
router.get('/:orgId/members', getOrganizationMembers);
router.post('/:orgId/leave', leaveOrganization);
router.get('/:orgId/analytics', cache(300), getOrganizationAnalytics);

module.exports = router;