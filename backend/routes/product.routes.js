const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const requireAdmin = require("../middlewares/admin.middleware");

router.get("/", productController.getProducts);
router.post("/", requireAdmin, productController.createProduct);
router.get("/:id", productController.getProduct);
router.put("/:id", requireAdmin, productController.updateProduct);
router.delete("/:id", requireAdmin, productController.deleteProduct);

module.exports = router;