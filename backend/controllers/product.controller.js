const Product = require("../models/product.model");
const productFields = ["name", "category", "color", "colors", "price_mad", "description", "image_url", "sizes", "is_featured", "is_bestseller"];

const writableProduct = (input = {}) => Object.fromEntries(
  productFields.filter((field) => Object.hasOwn(input, field)).map((field) => [field, input[field]])
);

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(writableProduct(req.body));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const filter = {
      category: { $in: ["men", "women", "accesories"] },
      price_mad: { $gt: 0 },
      color: { $type: "string" },
      image_url: { $type: "string" },
    };
    if (req.query.category) {
      const category = req.query.category === "accessories" ? "accesories" : req.query.category;
      if (!["men", "women", "accesories"].includes(category)) return res.status(400).json({ message: "Unknown product category" });
      filter.category = category;
    }
    const products = await Product.find(filter).sort({ is_featured: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, writableProduct(req.body), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product removed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};