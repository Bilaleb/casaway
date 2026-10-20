/**
 * Standalone fare seeding: refreshes the regulated per-seat fares on the top
 * 20 Casablanca depot documents without touching routes or trajectories.
 *
 * Usage: npm run seed:fares  (from backend/)
 */
const mongoose = require("mongoose");
require("dotenv").config();

const Route = require("../models/Route");
const { seedFares } = require("./seed-routes");
const { FARES, SEATS_PER_TAXI } = require("../config/fares");

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const attached = await seedFares();
  const withFare = await Route.countDocuments({ fare: { $exists: true } });
  console.log(
    `Fares synced: ${attached} document(s) updated · ${withFare}/${FARES.length} depots carry a fare · ${SEATS_PER_TAXI}-seat Courssa basis`
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Fare seeding failed", error);
  process.exit(1);
});
