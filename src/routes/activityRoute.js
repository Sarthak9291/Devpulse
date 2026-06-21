const express= require("express");
const router = express.Router();
const {
    getRepositoryActivities,
    getOrganizationActivities
} = require("../controllers/activityController");


router.get("/:repositoryId", getRepositoryActivities);
router.get("/org/:organizationId", getOrganizationActivities);

module.exports = router;