const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  product_id: { type: String, required: true },
  product_name: { type: String, required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  price_mad: { type: Number, required: true, min: 1 },
  quantity: { type: Number, required: true, min: 1 },
}, { collection: "order_items" });

module.exports = mongoose.model("OrderItem", orderItemSchema);