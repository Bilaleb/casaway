const express = require("express");
const fs = require("fs");
const path = require("path");
const Route = require("./models/Route");

const app = express();
const clientBuildDirectory = path.join(__dirname, "..", "frontend", "client", "dist");

app.use(express.json({ limit: "2mb" })); // GPX uploads can exceed the 100kb default

// Casaway API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Casaway", timestamp: new Date().toISOString() });
});

// Fallback catalogue used when the database is unreachable.
const STATIONS = [
  { id: 1, name: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", district: "Centre Ville", coordinates: [33.5912, -7.6134], taxiType: "Grand Taxi", destinations: ["Oulfa", "Maarif", "Ain Diab"] },
  { id: 2, name: "Dépôt Casa-Port", district: "Casa-Port", coordinates: [33.6002, -7.6119], taxiType: "Grand & Petit Taxi", destinations: ["Ain Sebaa", "Sidi Bernoussi", "Mohammedia"] },
  { id: 3, name: "Dépôt Casa-Voyageurs", district: "Casa-Voyageurs", coordinates: [33.5892, -7.5891], taxiType: "Grand & Petit Taxi", destinations: ["Centre Ville", "Hay Mohammadi", "Derb Sultan"] },
  { id: 4, name: "Dépôt Garage Allal (Derb Sultan)", district: "Derb Sultan", coordinates: [33.5715, -7.6045], taxiType: "Grand Taxi", destinations: ["Mediouna", "Tit Mellil", "Bouskoura"] },
  { id: 5, name: "Dépôt Rond-Point Bachkou", district: "Bachkou", coordinates: [33.5583, -7.6251], taxiType: "Grand Taxi", destinations: ["Near University", "Oulfa", "Sidi Maalouf"] },
  { id: 6, name: "Dépôt L-Oulfa (Terminus / Bd Moulay Rachid)", district: "Oulfa", coordinates: [33.5511, -7.6698], taxiType: "Grand Taxi", destinations: ["Centre Ville", "Maarif", "Errahma"] },
  { id: 7, name: "Dépôt Sidi Bernoussi (Bd Imam Ali)", district: "Sidi Bernoussi", coordinates: [33.6085, -7.5214], taxiType: "Grand Taxi", destinations: ["Mohammedia", "Tit Mellil", "Casa-Port"] },
  { id: 8, name: "Dépôt Ain Sebaa (L-Gara / Near Train Station)", district: "Ain Sebaa", coordinates: [33.6068, -7.5452], taxiType: "Grand Taxi", destinations: ["Sidi Bernoussi", "Centre Ville"] },
  { id: 9, name: "Dépôt Maarif (Bd Bir Anzarane / Twin Center)", district: "Maarif", coordinates: [33.5824, -7.6361], taxiType: "Petit Taxi & Grand Taxi Hub", destinations: ["Grand taxi hub", "Twin Center", "Ain Diab"] },
  { id: 10, name: "Dépôt Hay Hassani (SOUK / Terminus)", district: "Hay Hassani", coordinates: [33.5602, -7.6582], taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa", "Maarif"] },
  { id: 11, name: "Dépôt Lissasfa (Route d'El Jadida / Rond Point)", district: "Lissasfa", coordinates: [33.5341, -7.6781], taxiType: "Grand Taxi", destinations: ["Azemmour", "Had Soualem", "Errahma"] },
  { id: 12, name: "Dépôt Derb Omar / Bd Mohammed V", district: "Derb Omar", coordinates: [33.5938, -7.6087], taxiType: "Petit Taxi & Regional Grand Taxi", destinations: ["Centre Ville", "Casa-Voyageurs", "Regional routes"] },
  { id: 13, name: "Dépôt Sidi Moumen (Terminus Tramway Anassi)", district: "Sidi Moumen", coordinates: [33.5871, -7.5023], taxiType: "Grand Taxi", destinations: ["Bernoussi", "Tit Mellil"] },
  { id: 14, name: "Dépôt Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", district: "Hay Mohammadi", coordinates: [33.5921, -7.5658], taxiType: "Grand Taxi", destinations: ["Casa-Voyageurs", "Sidi Bernoussi"] },
  { id: 15, name: "Dépôt Sbata (Rond Point Jamila)", district: "Sbata", coordinates: [33.5542, -7.5681], taxiType: "Grand Taxi", destinations: ["Garage Allal", "Derb Sultan", "Ain Chock"] },
  { id: 16, name: "Dépôt Ain Chock (Bd Baghdad / Near Faculté)", district: "Ain Chock", coordinates: [33.5488, -7.6012], taxiType: "Grand Taxi", destinations: ["Bachkou", "Derb Sultan", "Sidi Maalouf"] },
  { id: 17, name: "Dépôt Errahma (Ville Nouvelle / Main Roundabout)", district: "Errahma", coordinates: [33.5124, -7.7115], taxiType: "Grand Taxi", destinations: ["Oulfa", "Lissasfa"] },
  { id: 18, name: "Dépôt Tit Mellil (Centre)", district: "Tit Mellil", coordinates: [33.554, -7.4812], taxiType: "Regional Grand Taxi", destinations: ["Garage Allal", "Bernoussi"] },
  { id: 19, name: "Dépôt Sidi Maalouf (Near Technopark)", district: "Sidi Maalouf", coordinates: [33.5421, -7.6385], taxiType: "Grand Taxi", destinations: ["Bachkou", "Shorex", "Zenith"] },
  { id: 20, name: "Dépôt Sidi Bernoussi - Tram Terminus", district: "Sidi Bernoussi", coordinates: [33.6152, -7.5089], taxiType: "Grand Taxi", destinations: ["Zone Industrielle", "Mohammedia"] }
];

const stationsFromDatabase = async () => {
  const docs = await Route.find({});
  const depots = new Map();
  docs.forEach((doc) => {
    if (!doc.location?.coordinates || depots.has(doc.depotName)) return;
    depots.set(doc.depotName, doc);
  });
  return [...depots.values()].map((doc, index) => ({
    id: index + 1,
    name: doc.depotName,
    district: doc.district,
    taxiType: doc.taxiType,
    coordinates: [doc.location.coordinates[1], doc.location.coordinates[0]],
    destinations: [],
  }));
};

app.get("/api/stations", async (req, res) => {
  const { type, district } = req.query;
  let result;
  try {
    result = await stationsFromDatabase();
  } catch {
    result = STATIONS;
  }
  if (type) {
    result = result.filter((s) => s.taxiType.toLowerCase().includes(type.toLowerCase()));
  }
  if (district) {
    result = result.filter((s) => s.district.toLowerCase().includes(district.toLowerCase()));
  }
  res.json(result);
});

app.get("/api/stations/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  let result;
  try {
    result = await stationsFromDatabase();
  } catch {
    result = STATIONS;
  }
  const station = result.find((s) => s.id === id);
  if (!station) return res.status(404).json({ error: "Depot not found" });
  res.json(station);
});

// GeoJSON route catalogue (MongoDB, 2dsphere indexes): create/list/search/nearby
app.use("/api/routes", require("./routes/api"));

// Community route/station reports from the feedback drawer.
app.use("/api/feedback", require("./routes/feedback"));

// Serve static frontend build
app.use(express.static(clientBuildDirectory));

// SPA fallback
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path === "/api" || req.path.startsWith("/api/")) {
    return next();
  }
  const clientEntry = path.join(clientBuildDirectory, "index.html");
  if (!fs.existsSync(clientEntry)) return next();
  res.sendFile(clientEntry, (error) => {
    if (error && !res.headersSent) next();
  });
});

module.exports = app;
