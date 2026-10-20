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
  { depotName: "Dépôt Casa-Port", origin: "Dépôt Casa-Port", destination: "Ain Sebaa / Bernoussi", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 7.5, estimatedTimeMins: 20 },
  { depotName: "Dépôt Casa-Voyageurs", origin: "Dépôt Casa-Voyageurs", destination: "Centre Ville / Derb Sultan", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 3.5, estimatedTimeMins: 12 },
  { depotName: "Dépôt Garage Allal (Derb Sultan)", origin: "Dépôt Garage Allal", destination: "Mediouna / Bouskoura", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 9.0, estimatedTimeMins: 25 },
  { depotName: "Dépôt Rond-Point Bachkou", origin: "Dépôt Rond-Point Bachkou", destination: "Facultés / Oulfa", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 4.0, estimatedTimeMins: 13 },
  { depotName: "Dépôt L-Oulfa (Terminus / Bd Moulay Rachid)", origin: "Dépôt L-Oulfa", destination: "Maarif / Concorde", baseDayPriceMAD: 8.5, baseNightPriceMAD: 13.0, estimatedDistanceKM: 9.0, estimatedTimeMins: 24 },
  { depotName: "Dépôt Sidi Bernoussi (Bd Imam Ali)", origin: "Dépôt Sidi Bernoussi", destination: "Mohammedia", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 32 },
  { depotName: "Dépôt Ain Sebaa (L-Gara / Near Train Station)", origin: "Dépôt Ain Sebaa (L-Gara)", destination: "Centre Ville", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 6.0, estimatedTimeMins: 17 },
  { depotName: "Dépôt Maarif (Bd Bir Anzarane / Twin Center)", origin: "Dépôt Maarif (Bir Anzarane)", destination: "Hay Hassani", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: "Dépôt Hay Hassani (SOUK / Terminus)", origin: "Dépôt Hay Hassani", destination: "Lissasfa / Errahma", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 7.0, estimatedTimeMins: 19 },
  { depotName: "Dépôt Lissasfa (Route d'El Jadida / Rond Point)", origin: "Dépôt Lissasfa", destination: "Had Soualem / Errahma", baseDayPriceMAD: 10.0, baseNightPriceMAD: 15.0, estimatedDistanceKM: 11.0, estimatedTimeMins: 28 },
  { depotName: "Dépôt Derb Omar / Bd Mohammed V", origin: "Dépôt Derb Omar", destination: "Ain Sebaa", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 6.5, estimatedTimeMins: 18 },
  { depotName: "Dépôt Sidi Moumen (Terminus Tramway Anassi)", origin: "Dépôt Sidi Moumen (Anassi)", destination: "Tit Mellil", baseDayPriceMAD: 8.0, baseNightPriceMAD: 12.0, estimatedDistanceKM: 13.0, estimatedTimeMins: 30 },
  { depotName: "Dépôt Hay Mohammadi (Place Bouchentouf / Bd Ali Yata)", origin: "Dépôt Hay Mohammadi", destination: "Casa-Port", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.5, estimatedTimeMins: 16 },
  { depotName: "Dépôt Sbata (Rond Point Jamila)", origin: "Dépôt Sbata (Jamila)", destination: "Garage Allal", baseDayPriceMAD: 7.5, baseNightPriceMAD: 11.0, estimatedDistanceKM: 4.5, estimatedTimeMins: 14 },
  { depotName: "Dépôt Ain Chock (Bd Baghdad / Near Faculté)", origin: "Dépôt Ain Chock", destination: "Bachkou / Derb Sultan", baseDayPriceMAD: 7.0, baseNightPriceMAD: 10.5, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
  { depotName: "Dépôt Errahma (Ville Nouvelle / Main Roundabout)", origin: "Dépôt Errahma", destination: "Oulfa / Lissasfa", baseDayPriceMAD: 9.0, baseNightPriceMAD: 13.5, estimatedDistanceKM: 9.5, estimatedTimeMins: 25 },
  { depotName: "Dépôt Tit Mellil (Centre)", origin: "Dépôt Tit Mellil", destination: "Bernoussi / Garage Allal", baseDayPriceMAD: 11.0, baseNightPriceMAD: 16.5, estimatedDistanceKM: 14.0, estimatedTimeMins: 33 },
  { depotName: "Dépôt Sidi Maalouf (Near Technopark)", origin: "Dépôt Sidi Maalouf", destination: "Technopark / Bachkou", baseDayPriceMAD: 6.5, baseNightPriceMAD: 10.0, estimatedDistanceKM: 4.0, estimatedTimeMins: 12 },
  { depotName: "Dépôt Sidi Bernoussi - Tram Terminus", origin: "Dépôt Sidi Bernoussi Tramway", destination: "Zone Industrielle", baseDayPriceMAD: 9.5, baseNightPriceMAD: 14.0, estimatedDistanceKM: 5.0, estimatedTimeMins: 15 },
].map((fare) => ({ ...fare, currency: CURRENCY }));

module.exports = { FARES, SEATS_PER_TAXI, NIGHT_START_HOUR, CURRENCY };
