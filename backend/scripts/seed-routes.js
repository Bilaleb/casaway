const Route = require("../models/Route");
const { gpxToLineString } = require("../utils/gpx");
const { FARES } = require("../config/fares");

// The 20 Casaway taxi depots, as [latitude, longitude].
const DEPOTS = [
  { name: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", district: "Centre Ville", taxiType: "Grand Taxi", coordinates: [33.5912, -7.6134] },
  { name: "Dépôt Casa-Port", district: "Casa-Port", taxiType: "Grand & Petit Taxi", coordinates: [33.6002, -7.6119] },
  { name: "Dépôt Casa-Voyageurs", district: "Casa-Voyageurs", taxiType: "Grand & Petit Taxi", coordinates: [33.5892, -7.5891] },
  { name: "Dépôt Garage Allal (Derb Sultan)", district: "Derb Sultan", taxiType: "Grand Taxi", coordinates: [33.5715, -7.6045] },
  { name: "Dépôt Rond-Point Bachkou", district: "Bachkou", taxiType: "Grand Taxi", coordinates: [33.5583, -7.6251] },
  { name: "Dépôt L-Oulfa (Terminus / Bd Moulay Rachid)", district: "Oulfa", taxiType: "Grand Taxi", coordinates: [33.5511, -7.6698] },
  { name: "Dépôt Sidi Bernoussi (Bd Imam Ali)", district: "Sidi Bernoussi", taxiType: "Grand Taxi", coordinates: [33.6085, -7.5214] },
  { name: "Dépôt Ain Sebaa (L-Gara / Near Train Station)", district: "Ain Sebaa", taxiType: "Grand Taxi", coordinates: [33.6068, -7.5452] },
  { name: "Dépôt Maarif (Bd Bir Anzarane / Twin Center)", district: "Maarif", taxiType: "Grand & Petit Taxi", coordinates: [33.5824, -7.6361] },
  { name: "Dépôt Hay Hassani (SOUK / Terminus)", district: "Hay Hassani", taxiType: "Grand Taxi", coordinates: [33.5602, -7.6582] },
  { name: "Dépôt Lissasfa (Route d'El Jadida / Rond Point)", district: "Lissasfa", taxiType: "Grand Taxi", coordinates: [33.5341, -7.6781] },
  { name: "Dépôt Derb Omar / Bd Mohammed V", district: "Derb Omar", taxiType: "Grand & Petit Taxi", coordinates: [33.5938, -7.6087] },
  { name: "Dépôt Sidi Moumen (Terminus Tramway Anassi)", district: "Sidi Moumen", taxiType: "Grand Taxi", coordinates: [33.5871, -7.5023] },
  { name: "Dépôt Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", district: "Hay Mohammadi", taxiType: "Grand Taxi", coordinates: [33.5921, -7.5658] },
  { name: "Dépôt Sbata (Rond Point Jamila)", district: "Sbata", taxiType: "Grand Taxi", coordinates: [33.5542, -7.5681] },
  { name: "Dépôt Ain Chock (Bd Baghdad / Near Faculté)", district: "Ain Chock", taxiType: "Grand Taxi", coordinates: [33.5488, -7.6012] },
  { name: "Dépôt Errahma (Ville Nouvelle / Main Roundabout)", district: "Errahma", taxiType: "Grand Taxi", coordinates: [33.5124, -7.7115] },
  { name: "Dépôt Tit Mellil (Centre)", district: "Tit Mellil", taxiType: "Grand Taxi", coordinates: [33.554, -7.4812] },
  { name: "Dépôt Sidi Maalouf (Near Technopark)", district: "Sidi Maalouf", taxiType: "Grand Taxi", coordinates: [33.5421, -7.6385] },
  { name: "Dépôt Sidi Bernoussi - Tram Terminus", district: "Sidi Bernoussi", taxiType: "Grand Taxi", coordinates: [33.6152, -7.5089] },
];

const ROUTES = [
  { from: 0, to: 5, name: "Place de la Concorde to Oulfa" },
  { from: 0, to: 18, name: "Place de la Concorde to Sidi Maalouf" },
  { from: 1, to: 6, name: "Casa-Port to Sidi Bernoussi" },
  { from: 2, to: 13, name: "Casa-Voyageurs to Hay Mohammadi" },
  { from: 11, to: 5, name: "Derb Omar to Oulfa" },
  { from: 8, to: 5, name: "Maarif to L-Oulfa" },
  { from: 3, to: 17, name: "Garage Allal to Tit Mellil" },
  { from: 9, to: 8, name: "Hay Hassani to Maarif" },
];

// Builds a gently bent illustrative trajectory between two depots.
const trace = (from, to, { points = 28, bend = 0.008 } = {}) => {
  const [latA, lngA] = from;
  const [latB, lngB] = to;
  const dLat = latB - latA;
  const dLng = lngB - lngA;
  const length = Math.hypot(dLat, dLng) || 1;
  const perpLat = -dLng / length;
  const perpLng = dLat / length;
  const coordinates = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const swing = Math.sin(Math.PI * t) * bend;
    coordinates.push([
      Number((lngA + dLng * t + perpLng * swing).toFixed(5)),
      Number((latA + dLat * t + perpLat * swing).toFixed(5)),
    ]);
  }
  return { type: "LineString", coordinates };
};

const toGpx = (name, lineString) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Casaway" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${name}</name><trkseg>${lineString.coordinates
    .map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join("")}</trkseg></trk>
</gpx>`;

/**
 * Attaches the regulated per-seat fare (day/night/Courssa basis) to each of
 * the top-20 depot documents. Keyed by depot coordinates — stable across the
 * "Station …" -> "Dépôt …" rename — and $sets name/depotName so the rename
 * lands on already-seeded databases. Re-run any time prices change (see
 * scripts/seed-fares.js).
 */
async function seedFares() {
  let attached = 0;
  for (const fare of FARES) {
    const { depotName, ...update } = fare;
    const depot = DEPOTS.find((entry) => entry.name === depotName);
    const filter = depot
      ? { "location.coordinates": [depot.coordinates[1], depot.coordinates[0]] }
      : { $or: [{ name: depotName }, { depotName }] };
    const result = await Route.updateMany(filter, {
      $set: { fare: update, name: depotName, depotName },
    });
    attached += result.modifiedCount || 0;
  }
  return attached;
}

async function seedRoutes() {
  let inserted = 0;

  for (const depot of DEPOTS) {
    const [lat, lng] = depot.coordinates;
    const document = {
      name: depot.name,
      depotName: depot.name,
      taxiType: depot.taxiType,
      district: depot.district,
      location: { type: "Point", coordinates: [lng, lat] },
    };
    // Keyed by coordinates: a rerun updates (renames) the existing depot
    // document instead of inserting a duplicate under its new name.
    const result = await Route.updateOne(
      { "location.coordinates": [lng, lat] },
      { $set: { name: document.name, depotName: document.depotName, taxiType: document.taxiType, district: document.district } },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
  }

  for (const route of ROUTES) {
    const origin = DEPOTS[route.from];
    const destination = DEPOTS[route.to];
    const document = {
      name: route.name,
      depotName: origin.name,
      taxiType: origin.taxiType.includes("Petit") ? "Grand & Petit Taxi" : "Grand Taxi",
      district: origin.district,
      location: { type: "Point", coordinates: [origin.coordinates[1], origin.coordinates[0]] },
      trajectory: trace(origin.coordinates, destination.coordinates),
    };
    // Keyed by route name: depot renames update depotName in place, never
    // duplicating a trajectory under a second document.
    const result = await Route.updateOne({ name: document.name }, { $set: document }, { upsert: true });
    if (result.upsertedCount) inserted += 1;
  }

  // One route ingested through the GPX pipeline to prove the converter works.
  const gpxOrigin = DEPOTS[14];
  const gpxDestination = DEPOTS[15];
  const gpxRoute = {
    name: "Sbata to Ain Chock (GPX)",
    depotName: gpxOrigin.name,
    taxiType: "Grand Taxi",
    district: gpxOrigin.district,
    location: { type: "Point", coordinates: [gpxOrigin.coordinates[1], gpxOrigin.coordinates[0]] },
    trajectory: gpxToLineString(toGpx("Sbata to Ain Chock", trace(gpxOrigin.coordinates, gpxDestination.coordinates, { points: 12 }))),
  };
  const gpxResult = await Route.updateOne({ name: gpxRoute.name }, { $set: gpxRoute }, { upsert: true });
  if (gpxResult.upsertedCount) inserted += 1;

  const faresAttached = await seedFares();
  console.log(`Seeded ${inserted} Casaway depots/routes (${await Route.countDocuments()} total) · ${faresAttached} fares attached`);
}

module.exports = seedRoutes;
module.exports.seedFares = seedFares;

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");
  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedRoutes();
      process.exit(0);
    })
    .catch((error) => {
      console.error("Route seeding failed", error);
      process.exit(1);
    });
}
