const express = require("express");
const adminController = require("../controllers/admin.controller");
const requireAdmin = require("../middlewares/admin.middleware");

const router = express.Router();

router.get("/session", adminController.session);
router.post("/login", adminController.login);
router.post("/logout", requireAdmin, adminController.logout);

module.exports = router;