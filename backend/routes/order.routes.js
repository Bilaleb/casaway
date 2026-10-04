const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const requireAdmin = require("../middlewares/admin.middleware");

router.get("/", requireAdmin, orderController.getOrders);
router.post("/", orderController.createOrder);
router.post("/stripe-checkout", orderController.createStripeCheckout);
router.get("/stripe-session/:sessionId", orderController.confirmStripeCheckout);
router.patch("/:id/status", requireAdmin, orderController.updateOrderStatus);

module.exports = router;