require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const seedProducts = require("./config/seed");

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await seedProducts();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Server startup failed", error);
  process.exit(1);
});