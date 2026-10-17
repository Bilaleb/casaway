const Route = require("../models/Route");
const { TAXI_TYPES } = Route;
const { isPosition, escapeRegex, haversineMeters } = require("../utils/geo");
const { gpxToLineString } = require("../utils/gpx");

const DEFAULT_NEARBY_RADIUS_METERS = 5000;
const MAX_NEARBY_RADIUS_METERS = 50000;
const NEARBY_LIMIT = 50;

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

/**
 * Mongoose surfaces an unreachable database as a buffering/network error
 * (e.g. Atlas IP whitelist). Those are service-availability problems, so the
 * API answers 503 — the client falls back to its snapshot/bundled catalogue —
 * while genuine programming errors still surface as 500.
 */
const isDatabaseUnavailable = (err) =>
  err?.name === "MongooseError" ||
  err?.name === "MongoServerSelectionError" ||
  err?.name === "MongoNetworkError" ||
  err?.code === "ETIMEOUT" ||
  /buffer|buffering timed out|getaddrinfo|connection/i.test(err?.message || "");

const failDatabase = (res, err) =>
  isDatabaseUnavailable(err)
    ? res.status(503).json({ message: "Route data is unavailable right now (database unreachable)" })
    : res.status(500).json({ message: err.message });

/**
 * Validates and normalises a POST /api/routes payload. Accepts either an
 * explicit GeoJSON LineString trajectory (map draws) or a raw `gpx` string
 * that is converted server-side by utils/gpx.js. When no depot location is
 * supplied, the first trajectory point is used as the depot position.
 */
function parseRoutePayload(input = {}) {
  const errors = [];

  for (const field of ["name", "depotName", "district"]) {
    if (!nonEmptyString(input[field])) errors.push(`"${field}" must be a non-empty string`);
  }

  if (!TAXI_TYPES.includes(input.taxiType)) {
    errors.push(`"taxiType" must be one of: ${TAXI_TYPES.join(", ")}`);
  }

  let trajectory;
  if (input.gpx !== undefined && input.gpx !== null && input.gpx !== "") {
    if (!nonEmptyString(input.gpx)) {
      errors.push('"gpx" must be a GPX file content string');
    } else {
      try {
        trajectory = gpxToLineString(input.gpx);
      } catch (error) {
        errors.push(`"gpx" could not be parsed: ${error.message}`);
      }
    }
  } else if (input.trajectory !== undefined && input.trajectory !== null) {
    const candidate = input.trajectory;
    const coordinates = Array.isArray(candidate) ? candidate : candidate.coordinates;
    if (!candidate || candidate.type !== "LineString" || !Array.isArray(coordinates) || coordinates.length < 2 || !coordinates.every(isPosition)) {
      errors.push('"trajectory" must be a GeoJSON LineString with at least two valid [lng, lat] positions');
    } else {
      trajectory = { type: "LineString", coordinates };
    }
  }

  let location;
  if (input.location !== undefined && input.location !== null) {
    const candidate = input.location;
    const coordinates = Array.isArray(candidate) ? [...candidate] : candidate.coordinates;
    if (!candidate || (!Array.isArray(candidate) && candidate.type !== "Point") || !isPosition(coordinates)) {
      errors.push('"location" must be a GeoJSON Point [lng, lat] inside valid bounds');
    } else {
      location = { type: "Point", coordinates };
    }
  } else if (trajectory) {
    location = { type: "Point", coordinates: trajectory.coordinates[0] };
  } else {
    errors.push('"location" is required (a GeoJSON Point, or provide a trajectory to derive it)');
  }

  if (errors.length) return { errors };

  return {
    route: {
      name: input.name.trim(),
      depotName: input.depotName.trim(),
      taxiType: input.taxiType,
      district: input.district.trim(),
      location,
      trajectory,
    },
  };
}

exports.createRoute = async (req, res) => {
  try {
    const { route, errors } = parseRoutePayload(req.body || {});
    if (errors) return res.status(400).json({ message: "Invalid route payload", errors });
    const saved = await Route.create(route);
    res.status(201).json(saved);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A route with this name already exists at this depot" });
    }
    res.status(400).json({ message: err.message });
  }
};

exports.getRoutes = async (req, res) => {
  try {
    const filter = {};
    if (req.query.taxiType) {
      if (!TAXI_TYPES.includes(req.query.taxiType)) {
        return res.status(400).json({ message: `Unknown taxi type. Expected one of: ${TAXI_TYPES.join(", ")}` });
      }
      filter.taxiType = req.query.taxiType;
    }
    const routes = await Route.find(filter).sort({ createdAt: -1 });
    res.json(routes);
  } catch (err) {
    failDatabase(res, err);
  }
};

exports.searchRoutes = async (req, res) => {
  try {
    const district = typeof req.query.district === "string" ? req.query.district.trim() : "";
    if (!district) return res.status(400).json({ message: "A district query is required: /api/routes/search?district=Maarif" });
    const pattern = new RegExp(escapeRegex(district), "i");
    const routes = await Route.find({ $or: [{ district: pattern }, { depotName: pattern }, { name: pattern }] }).sort({ district: 1, name: 1 });
    res.json(routes);
  } catch (err) {
    failDatabase(res, err);
  }
};

exports.findNearbyRoutes = async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isPosition([lng, lat])) {
      return res.status(400).json({ message: "Numeric lat/lng query parameters are required" });
    }

    const requested = Number(req.query.maxDistance);
    const maxDistance = Number.isFinite(requested) && requested > 0
      ? Math.min(requested, MAX_NEARBY_RADIUS_METERS)
      : DEFAULT_NEARBY_RADIUS_METERS;

    // $near returns depots sorted closest-first thanks to the 2dsphere index.
    const depots = await Route.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: maxDistance,
        },
      },
    }).limit(NEARBY_LIMIT);

    res.json(
      depots.map((depot) => ({
        ...depot.toJSON(),
        distanceMeters: Math.round(haversineMeters([lng, lat], depot.location.coordinates)),
      }))
    );
  } catch (err) {
    failDatabase(res, err);
  }
};
