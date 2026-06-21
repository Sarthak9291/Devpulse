const express = require("express");
const router = express.Router();

const webhookController =
    require("../controllers/webhookController");

const authmiddleware = require("../middleware/authMiddleware");

router.post(
    "/github",
    express.raw({ type: "application/json" }),
    webhookController.handleWebhookEvent
);

router.post(
    "/replay/:eventId",
    authmiddleware,
    webhookController.replayWebhookEvent
);

module.exports = router;