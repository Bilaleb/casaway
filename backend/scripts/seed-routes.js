const Route = require("../models/Route");
const { gpxToLineString } = require("../utils/gpx");

// The 20 Casaway taxi depots, as [latitude, longitude].
const DEPOTS = [
  { name: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", district: "Centre Ville", taxiType: "Grand Taxi", coordinates: [33.5912, -7.6134] },
  { name: "Station Casa-Port", district: "Casa-Port", taxiType: "Grand & Petit Taxi", coordinates: [33.6002, -7.6119] },
  { name: "Station Casa-Voyageurs", district: "Casa-Voyageurs", taxiType: "Grand & Petit Taxi", coordinates: [33.5892, -7.5891] },
  { name: "Station Garage Allal (Derb Sultan)", district: "Derb Sultan", taxiType: "Grand Taxi", coordinates: [33.5715, -7.6045] },
  { name: "Station Rond-Point Bachkou", district: "Bachkou", taxiType: "Grand Taxi", coordinates: [33.5583, -7.6251] },
  { name: "Station L-Oulfa (Terminus / Bd Moulay Rachid)", district: "Oulfa", taxiType: "Grand Taxi", coordinates: [33.5511, -7.6698] },
  { name: "Station Sidi Bernoussi (Bd Imam Ali)", district: "Sidi Bernoussi", taxiType: "Grand Taxi", coordinates: [33.6085, -7.5214] },
  { name: "Station Ain Sebaa (L-Gara / Near Train Station)", district: "Ain Sebaa", taxiType: "Grand Taxi", coordinates: [33.6068, -7.5452] },
  { name: "Station Maarif (Bd Bir Anzarane / Twin Center)", district: "Maarif", taxiType: "Grand & Petit Taxi", coordinates: [33.5824, -7.6361] },
  { name: "Station Hay Hassani (SOUK / Terminus)", district: "Hay Hassani", taxiType: "Grand Taxi", coordinates: [33.5602, -7.6582] },
  { name: "Station Lissasfa (Route d'El Jadida / Rond Point)", district: "Lissasfa", taxiType: "Grand Taxi", coordinates: [33.5341, -7.6781] },
  { name: "Station Derb Omar / Bd Mohammed V", district: "Derb Omar", taxiType: "Grand & Petit Taxi", coordinates: [33.5938, -7.6087] },
  { name: "Station Sidi Moumen (Terminus Tramway Anassi)", district: "Sidi Moumen", taxiType: "Grand Taxi", coordinates: [33.5871, -7.5023] },
  { name: "Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", district: "Hay Mohammadi", taxiType: "Grand Taxi", coordinates: [33.5921, -7.5658] },
  { name: "Station Sbata (Rond Point Jamila)", district: "Sbata", taxiType: "Grand Taxi", coordinates: [33.5542, -7.5681] },
  { name: "Station Ain Chock (Bd Baghdad / Near Faculté)", district: "Ain Chock", taxiType: "Grand Taxi", coordinates: [33.5488, -7.6012] },
  { name: "Station Errahma (Ville Nouvelle / Main Roundabout)", district: "Errahma", taxiType: "Grand Taxi", coordinates: [33.5124, -7.7115] },
  { name: "Station Tit Mellil (Centre)", district: "Tit Mellil", taxiType: "Grand Taxi", coordinates: [33.554, -7.4812] },
  { name: "Station Sidi Maalouf (Near Technopark)", district: "Sidi Maalouf", taxiType: "Grand Taxi", coordinates: [33.5421, -7.6385] },
  { name: "Station Sidi Bernoussi - Tram Terminus", district: "Sidi Bernoussi", taxiType: "Grand Taxi", coordinates: [33.6152, -7.5089] },
];

const ROUTES = [
  { from: 0, to: 5, name: "Place de la Concorde to Oulfa", fareEstimate: 20 },
  { from: 0, to: 18, name: "Place de la Concorde to Sidi Maalouf", fareEstimate: 30 },
  { from: 1, to: 6, name: "Casa-Port to Sidi Bernoussi", fareEstimate: 25 },
  { from: 2, to: 13, name: "Casa-Voyageurs to Hay Mohammadi", fareEstimate: 15 },
  { from: 11, to: 5, name: "Derb Omar to Oulfa", fareEstimate: 25 },
  { from: 8, to: 5, name: "Maarif to L-Oulfa", fareEstimate: 20 },
  { from: 3, to: 17, name: "Garage Allal to Tit Mellil", fareEstimate: 35 },
  { from: 9, to: 8, name: "Hay Hassani to Maarif", fareEstimate: 15 },
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
    const result = await Route.updateOne({ name: document.name, depotName: document.depotName }, { $setOnInsert: document }, { upsert: true });
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
      fareEstimate: route.fareEstimate,
      location: { type: "Point", coordinates: [origin.coordinates[1], origin.coordinates[0]] },
      trajectory: trace(origin.coordinates, destination.coordinates),
    };
    const result = await Route.updateOne({ name: document.name, depotName: document.depotName }, { $setOnInsert: document }, { upsert: true });
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
    fareEstimate: 10,
    location: { type: "Point", coordinates: [gpxOrigin.coordinates[1], gpxOrigin.coordinates[0]] },
    trajectory: gpxToLineString(toGpx("Sbata to Ain Chock", trace(gpxOrigin.coordinates, gpxDestination.coordinates, { points: 12 }))),
  };
  const gpxResult = await Route.updateOne({ name: gpxRoute.name, depotName: gpxRoute.depotName }, { $setOnInsert: gpxRoute }, { upsert: true });
  if (gpxResult.upsertedCount) inserted += 1;

  console.log(`Seeded ${inserted} Casaway depots/routes (${await Route.countDocuments()} total)`);
}

module.exports = seedRoutes;

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
