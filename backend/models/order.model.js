const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer_name: { type: String, required: true, trim: true },
  phone_number: { type: String, required: true, trim: true },
  delivery_address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  total_amount_mad: { type: Number, required: true, min: 1 },
  payment_method: { type: String, enum: ["Cash on Delivery", "Stripe"], default: "Cash on Delivery" },
  payment_status: { type: String, enum: ["Unpaid", "Paid", "Failed"], default: "Unpaid" },
  stripe_session_id: { type: String, default: null },
  status: { type: String, enum: ["Pending", "Confirmed", "Shipped", "Delivered"], default: "Pending" },
  created_at: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);