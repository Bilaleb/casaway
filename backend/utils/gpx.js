const { DOMParser } = require("@xmldom/xmldom");
const toGeoJSON = require("@tmcw/togeojson");

// Upper bound so a hostile upload cannot pin the event loop with a huge track.
const MAX_TRACK_POINTS = 50000;

const INVALID_GPX_MESSAGE = "Payload is not a valid GPX document";

// Malformed XML raises a controlled error instead of spamming the logs.
const parser = new DOMParser({
  onError: (level, message) => {
    if (level !== "warning") throw new Error(message);
  },
});

const parseXml = (gpxString) => {
  let document;
  try {
    document = parser.parseFromString(gpxString, "text/xml");
  } catch {
    throw new Error(INVALID_GPX_MESSAGE);
  }
  const root = document && document.documentElement;
  if (!root || root.nodeName === "parsererror" || !/gpx/i.test(root.nodeName)) {
    throw new Error(INVALID_GPX_MESSAGE);
  }
  return document;
};

const isUsableLine = (geometry) =>
  geometry &&
  (geometry.type === "LineString" || geometry.type === "MultiLineString") &&
  geometry.coordinates &&
  geometry.coordinates.length > 0;

/**
 * Parses a raw GPX string into a standard GeoJSON FeatureCollection using
 * @tmcw/togeojson (tracks, routes and waypoints become features).
 */
function gpxToGeoJSON(gpxString) {
  if (typeof gpxString !== "string" || !gpxString.trim()) {
    throw new Error("GPX payload must be a non-empty string");
  }
  const featureCollection = toGeoJSON.gpx(parseXml(gpxString));
  const pointCount = featureCollection.features.reduce((total, feature) => {
    const geometry = feature.geometry;
    if (!geometry || !geometry.coordinates) return total;
    if (geometry.type === "Point") return total + 1;
    return total + geometry.coordinates.length;
  }, 0);
  if (pointCount > MAX_TRACK_POINTS) {
    throw new Error(`GPX track too large (${pointCount} points, maximum ${MAX_TRACK_POINTS})`);
  }
  return featureCollection;
}

/**
 * Extracts the trajectory of a GPX file as a GeoJSON LineString (the shape
 * stored in Route.trajectory). The longest track/route wins when a file holds
 * several; multi-segment tracks are reduced to their longest segment.
 */
function gpxToLineString(gpxString) {
  const featureCollection = gpxToGeoJSON(gpxString);
  let best = null;

  for (const feature of featureCollection.features) {
    const geometry = feature.geometry;
    if (!isUsableLine(geometry)) continue;
    const segments = geometry.type === "LineString" ? [geometry.coordinates] : geometry.coordinates;
    for (const segment of segments) {
      if (!best || segment.length > best.length) best = segment;
    }
  }

  if (!best || best.length < 2) {
    throw new Error("GPX file contains no track or route with at least two points");
  }

  return { type: "LineString", coordinates: best };
}

module.exports = { gpxToGeoJSON, gpxToLineString };
