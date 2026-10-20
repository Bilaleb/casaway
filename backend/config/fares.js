/**
 * Regulated Grand Taxi fares for the top 20 Casablanca depots.
 *
 * Casablanca fare rules encoded here:
 *  - Fares are charged PER SEAT (a Grand Taxi has 6 passenger seats).
 *  - Day rate applies until 20:00; night rate (+~50%) applies after 20:00.
 *  - "Courssa" (full buyout) = per-seat rate x 6 seats.
 *
 * `depotName` matches the depot documents created by scripts/seed-routes.js
 * (and the bundled client station list), so fares attach 1:1 to depots.
 * estimatedDistanceKM / estimatedTimeMins are planning estimates for the
 * listed destination corridor (time at Casablanca's ~22 km/h city average).
 */
const SEATS_PER_TAXI = 6;
const NIGHT_START_HOUR = 20; // 20:00 — night rates kick in
const CURRENCY = "MAD";

const FARES = [
  { depotName: "Place de la Concorde (L-Hammam / Bd Lalla Yacout)", origin: "Place de la Concorde", destination: "Oulfa / Maarif", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 6.5, estimatedTimeMins: 18 },
  { depotName: "Station Casa-Port", origin: "Station Casa-Port", destination: "Ain Sebaa / Bernoussi", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 7.5, estimatedTimeMins: 20 },
  { depotName: "Station Casa-Voyageurs", origin: "Station Casa-Voyageurs", destination: "Centre Ville / Derb Sultan", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 3.5, estimatedTimeMins: 12 },
  { depotName: "Station Garage Allal (Derb Sultan)", origin: "Station Garage Allal", destination: "Mediouna / Bouskoura", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 9.0, estimatedTimeMins: 25 },
  { depotName: "Station Rond-Point Bachkou", origin: "Station Rond-Point Bachkou", destination: "Facultés / Oulfa", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 4.0, estimatedTimeMins: 13 },
  { depotName: "Station L-Oulfa (Terminus / Bd Moulay Rachid)", origin: "Station L-Oulfa", destination: "Maarif / Concorde", baseDayPriceMAD: 8.5, baseNightPriceMAD: 13.0, estimatedDistanceKM: 9.0, estimatedTimeMins: 24 },
  { depotName: "Station Sidi Bernoussi (Bd Imam Ali)", origin: "Station Sidi Bernoussi", destination: "Mohammedia", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 32 },
  { depotName: "Station Ain Sebaa (L-Gara / Near Train Station)", origin: "Station Ain Sebaa (L-Gara)", destination: "Centre Ville", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 6.0, estimatedTimeMins: 17 },
  { depotName: "Station Maarif (Bd Bir Anzarane / Twin Center)", origin: "Station Maarif (Bir Anzarane)", destination: "Hay Hassani", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: "Station Hay Hassani (SOUK / Terminus)", origin: "Station Hay Hassani", destination: "Lissasfa / Errahma", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 7.0, estimatedTimeMins: 19 },
  { depotName: "Station Lissasfa (Route d'El Jadida / Rond Point)", origin: "Station Lissasfa", destination: "Had Soualem / Errahma", baseDayPriceMAD: 10.0, baseNightPriceMAD: 15.0, estimatedDistanceKM: 11.0, estimatedTimeMins: 28 },
  { depotName: "Station Derb Omar / Bd Mohammed V", origin: "Station Derb Omar", destination: "Ain Sebaa", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 6.5, estimatedTimeMins: 18 },
  { depotName: "Station Sidi Moumen (Terminus Tramway Anassi)", origin: "Station Sidi Moumen (Anassi)", destination: "Tit Mellil", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 13.0, estimatedTimeMins: 30 },
  { depotName: "Station Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", origin: "Station Hay Mohammadi", destination: "Casa-Port", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.5, estimatedTimeMins: 16 },
  { depotName: "Station Sbata (Rond Point Jamila)", origin: "Station Sbata (Jamila)", destination: "Garage Allal", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: "Station Ain Chock (Bd Baghdad / Near Faculté)", origin: "Station Ain Chock", destination: "Bachkou / Derb Sultan", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
  { depotName: "Station Errahma (Ville Nouvelle / Main Roundabout)", origin: "Station Errahma", destination: "Oulfa / Lissasfa", baseDayPriceMAD: 9.0, baseNightPriceMAD: 13.5, estimatedDistanceKM: 9.5, estimatedTimeMins: 25 },
  { depotName: "Station Tit Mellil (Centre)", origin: "Station Tit Mellil", destination: "Bernoussi / Garage Allal", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 33 },
  { depotName: "Station Sidi Maalouf (Near Technopark)", origin: "Station Sidi Maalouf", destination: "Technopark / Bachkou", baseDayPriceMAD: 6.5, baseNightPriceMAD: 10.0, estimatedDistanceKM: 4.0, estimatedTimeMins: 12 },
  { depotName: "Station Sidi Bernoussi - Tram Terminus", origin: "Station Sidi Bernoussi Tramway", destination: "Zone Industrielle", baseDayPriceMAD: 9.5, baseNightPriceMAD: 14.0, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
].map((fare) => ({ ...fare, currency: CURRENCY }));

module.exports = { FARES, SEATS_PER_TAXI, NIGHT_START_HOUR, CURRENCY };
