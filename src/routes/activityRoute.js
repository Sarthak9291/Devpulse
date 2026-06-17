const express= require("express");
const router = express.Router();
const {
    getRepositoryActivities,
    getOrganizationActivities
} = require("../controllers/activityController");


router.get("/:orgId/:repositoryId", getRepositoryActivities);
router.get("/:orgId", getOrganizationActivities);

module.exports = router;