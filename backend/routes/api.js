const express = require("express");
const router = express.Router();
const routeController = require("../controllers/route.controller");

// Ingest a route (GeoJSON trajectory or raw GPX payload).
router.post("/", routeController.createRoute);
// Full catalogue for the initial map load.
router.get("/", routeController.getRoutes);
// District / station name search.
router.get("/search", routeController.searchRoutes);
// Depots within a radius of the user's location ($near + 2dsphere index).
router.get("/nearby", routeController.findNearbyRoutes);

module.exports = router;
