const path = require("path");
require("dotenv").config();
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected ✅"))
  .catch((error) => console.error("DB error ❌", error.message));

app.listen(PORT, HOST, () => {
  console.log(`Casaway server running on http://${HOST}:${PORT}`);
});
