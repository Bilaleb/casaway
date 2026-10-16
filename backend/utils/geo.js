const isPosition = (position) =>
  Array.isArray(position) &&
  position.length >= 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]) &&
  position[0] >= -180 &&
  position[0] <= 180 &&
  position[1] >= -90 &&
  position[1] <= 90;

// Escapes user input before it is embedded in a RegExp for $regex queries.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const EARTH_RADIUS_METERS = 6371000;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Haversine distance between two [longitude, latitude] positions, in meters.
const haversineMeters = ([lngA, latA], [lngB, latB]) => {
  const deltaLat = toRadians(latB - latA);
  const deltaLng = toRadians(lngB - lngA);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(latA)) * Math.cos(toRadians(latB)) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
};

module.exports = { isPosition, escapeRegex, haversineMeters };
