const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, enum: ["men", "women", "accesories"], required: true },
  color: { type: String, required: true, trim: true },
  colors: { type: [String], default: [] },
  price_mad: { type: Number, required: true, min: 1 },
  description: { type: String, required: true },
  image_url: { type: String, required: true },
  sizes: { type: [String], default: ["S", "M", "L", "XL", "2XL"] },
  is_featured: { type: Boolean, default: false },
  is_bestseller: { type: Boolean, default: false },
}, { timestamps: true });

productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);