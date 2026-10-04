const Product = require("../models/product.model");

const path = require("path");
const imageDirectory = path.resolve(__dirname, "..", "..", "libassi images");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function categoryFor(fileName) {
  const value = fileName.toLowerCase();
  if (/accessorie|bracelet|ring|earring|necklace|slippers/.test(value)) return "accesories";
  if (/men-s-|burnous|selham|cashmere|moroccan-winter|ouazzania-moroccan-djellaba-winter/.test(value)) return "men";
  return "women";
}

function colorFor(fileName) {
  const value = fileName.toLowerCase();
  const colors = [
    ["Bordeaux", /bordeaux|garnet/], ["Emerald", /emerald|bottle-green|green/],
    ["Navy", /navy|royal-blue/], ["Blue", /blue|bleu/], ["Black", /black|noire/],
    ["Khaki", /khaki/], ["Taupe", /taupe/], ["Grey", /grey|gray|anthracite/],
    ["Brown", /brown/], ["Cognac", /cognac/], ["Yellow gold", /yellow|gold/],
    ["Bronze", /bronze/], ["Cream", /cream|off-white|white|ivory/],
  ];
  return colors.find(([, pattern]) => pattern.test(value))?.[0] || "Artisan finish";
}

function productDetails(fileName, category, color) {
  const value = fileName.toLowerCase();
  if (category === "accesories") {
    if (value.includes("slippers")) return { name: "Leather babouche", price_mad: 490, sizes: Array.from({ length: 11 }, (_, index) => String(index + 35)) };
    if (value.includes("ring")) return { name: "Moroccan artisan ring", price_mad: 590, sizes: ["One size"] };
    if (value.includes("bracelet")) return { name: "Moroccan artisan bracelet", price_mad: 690, sizes: ["One size"] };
    if (value.includes("earring")) return { name: "Moroccan artisan earrings", price_mad: 590, sizes: ["One size"] };
    if (value.includes("necklace")) return { name: "Moroccan artisan necklace", price_mad: 990, sizes: ["One size"] };
    return { name: "Moroccan accessory", price_mad: 490, sizes: ["One size"] };
  }
  if (category === "men") {
    if (value.includes("jabador")) return { name: value.includes("2-piece") ? "Two-piece jabador" : "Three-piece jabador", price_mad: 2190, sizes: ["S", "M", "L", "XL", "2XL"] };
    if (value.includes("burnous") || value.includes("selham")) return { name: "Burnous and selham", price_mad: 2390, sizes: ["M", "L", "XL", "2XL"] };
    return { name: "Men's traditional djellaba", price_mad: 1890, sizes: ["M", "L", "XL", "2XL"] };
  }
  if (value.includes("takchita")) return { name: "Juny takchita", price_mad: 2890, sizes: ["S", "M", "L", "XL", "2XL"] };
  if (value.includes("kaftan")) return { name: "Moroccan embroidered kaftan", price_mad: 2390, sizes: ["S", "M", "L", "XL", "2XL"] };
  if (value.includes("gandoura")) return { name: "Jawhara embroidered gandoura", price_mad: 1790, sizes: ["S", "M", "L", "XL", "2XL"] };
  if (value.includes("ouazzania")) return { name: "Ouazzania striped djellaba", price_mad: 1690, sizes: ["S", "M", "L", "XL", "2XL"] };
  if (value.includes("muslin")) return { name: "Moroccan muslin djellaba", price_mad: 1590, sizes: ["S", "M", "L", "XL", "2XL"] };
  if (value.includes("linen")) return { name: "White linen djellaba", price_mad: 1690, sizes: ["S", "M", "L", "XL", "2XL"] };
  return { name: "Moroccan traditional djellaba", price_mad: 1590, sizes: ["S", "M", "L", "XL", "2XL"] };
}

function createCatalog() {
  return require("fs").readdirSync(imageDirectory)
    .filter((fileName) => imageExtensions.has(path.extname(fileName).toLowerCase()))
    .sort((first, second) => first.localeCompare(second))
    .map((fileName, index) => {
      const category = categoryFor(fileName);
      const color = colorFor(fileName);
      const details = productDetails(fileName, category, color);
      return {
        ...details,
        name: details.name,
        category,
        color,
        colors: [color],
        description: `${details.name} in ${color.toLowerCase()}, selected for its Moroccan character and carefully finished details.`,
        image_url: `/images/${fileName}`,
        sizes: details.sizes,
        is_featured: index % 11 === 0,
        is_bestseller: index % 4 === 0,
      };
    });
}

module.exports = async function seedProducts() {
  const products = createCatalog();
  const existingImages = new Set(await Product.distinct("image_url"));
  const missingProducts = products.filter((product) => !existingImages.has(product.image_url));
  if (missingProducts.length) {
    await Product.insertMany(missingProducts);
    console.log(`Seeded ${missingProducts.length} Libassi products`);
  }
};