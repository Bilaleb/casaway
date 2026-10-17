const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback.controller");

// Community route/station reports (validated, queue-retry friendly).
router.post("/", feedbackController.submitFeedback);

module.exports = router;