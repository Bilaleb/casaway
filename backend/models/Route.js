const mongoose = require("mongoose");

const TAXI_TYPES = ["Grand Taxi", "Petit Taxi", "Grand & Petit Taxi"];

// GeoJSON positions are [longitude, latitude]; Mongo 2dsphere rejects anything else.
const isPosition = (position) =>
  Array.isArray(position) &&
  position.length >= 2 &&
  Number.isFinite(position[0]) &&
  Number.isFinite(position[1]) &&
  position[0] >= -180 &&
  position[0] <= 180 &&
  position[1] >= -90 &&
  position[1] <= 90;

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: isPosition,
        message: "Point coordinates must be a [longitude, latitude] pair inside valid bounds",
      },
    },
  },
  { _id: false }
);const lineStringSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["LineString"], default: "LineString", required: true },
    coordinates: {
      type: [[Number]],
      required: true,
      validate: {
        validator: (coordinates) =>
          Array.isArray(coordinates) &&
          coordinates.length >= 2 &&
          coordinates.every(isPosition),
        message: "LineString coordinates must be at least two valid [longitude, latitude] positions",
      },
    },
  },
  { _id: false }
);

/**
 * Regulated Grand Taxi fare for one depot/route (prices are PER SEAT):
 * day rate until 20:00, night rate (+~50%) after 20:00, and the
 * "Courssa" full-taxi buyout is simply the per-seat rate x 6 seats.
 */
const fareSchema = new mongoose.Schema(
  {
    origin: { type: String, trim: true },
    destination: { type: String, trim: true },
    baseDayPriceMAD: {
      type: Number,
      required: [true, "baseDayPriceMAD is required"],
      min: [0, "baseDayPriceMAD cannot be negative"],
    },
    baseNightPriceMAD: {
      type: Number,
      required: [true, "baseNightPriceMAD is required"],
      min: [0, "baseNightPriceMAD cannot be negative"],
    },
    estimatedDistanceKM: {
      type: Number,
      required: [true, "estimatedDistanceKM is required"],
      min: [0, "estimatedDistanceKM cannot be negative"],
    },
    estimatedTimeMins: {
      type: Number,
      required: [true, "estimatedTimeMins is required"],
      min: [0, "estimatedTimeMins cannot be negative"],
    },
    currency: { type: String, default: "MAD", trim: true },
  },
  { _id: false }
);

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    depotName: { type: String, required: true, trim: true },
    taxiType: { type: String, enum: TAXI_TYPES, required: true },
    district: { type: String, required: true, trim: true },
    // Depot/origin marker.
    location: { type: pointSchema, required: true },
    // Full route trajectory; depot-only documents simply omit it.
    trajectory: { type: lineStringSchema },
    // Regulated per-seat fare for this depot/route (seeded for the top 20).
    fare: { type: fareSchema },
  },
  { timestamps: true }
);

routeSchema.index({ location: "2dsphere" });
routeSchema.index({ trajectory: "2dsphere" });
routeSchema.index({ name: 1, depotName: 1 }, { unique: true });
routeSchema.index({ district: 1 });
routeSchema.index({ taxiType: 1 });

routeSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Route", routeSchema);
module.exports.TAXI_TYPES = TAXI_TYPES;
module.exports.isPosition = isPosition;
module.exports.fareSchema = fareSchema;
