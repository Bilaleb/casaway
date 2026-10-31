/**
 * Pure geolocation helpers for Casaway.
 *
 * These functions depend only on math and DOM, not on React hooks or app
 * state, so they can be reused by markers, sidebar filtering, and the
 * Near Me feature without pulling in component concerns.
 */

/** Haversine distance in meters between two [lat, lon] pairs. */
export function haversineMeters([lat1, lon1], [lat2, lon2]) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable distance string from meters. */
export function formatDistance(meters) {
  if (meters == null || Number.isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Escape text for safe interpolation into Leaflet popup HTML. */
export function escapeHtml(value) {
  if (value == null) return '';
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}
