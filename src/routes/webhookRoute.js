const express = require("express");
const router = express.Router();

const webhookController =
    require("../controllers/webhookController");

router.post(
    "/github",
    express.raw({ type: "application/json" }),
    webhookController.handleWebhookEvent
);

module.exports = router;