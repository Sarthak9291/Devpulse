const {
   createOrganization,
    joinOrganization,
    getMyOrganizations,
    getOrganizationMembers,
    leaveOrganization
} = require('../controllers/orgController');

const express = require('express');
const router = express.Router();
router.post('/create', createOrganization);
router.post('/join', joinOrganization);
router.get('/getorganizations', getMyOrganizations);
router.get('/:orgId/members', getOrganizationMembers);
router.post('/:orgId/leave', leaveOrganization);
module.exports = router;