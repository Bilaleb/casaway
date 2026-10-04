const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// register
router.post("/register", userController.register);
router.get("/", userController.getUsers);
module.exports = router;