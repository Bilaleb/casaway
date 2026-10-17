const mongoose = require("mongoose");

const KINDS = ["route-update", "station-correction", "missing-station", "other"];

// Community reports about stations/routes. No pricing data belongs here or
// anywhere in Casaway — reports describe what changed on the ground.
const feedbackSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: KINDS, required: true },
    subject: { type: String, trim: true, maxlength: 160, default: "" },
    details: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    email: { type: String, trim: true, maxlength: 200, default: "" },
    context: {
      path: { type: String, maxlength: 300, default: "" },
      userAgent: { type: String, maxlength: 300, default: "" },
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ kind: 1, createdAt: -1 });

feedbackSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
module.exports.KINDS = KINDS;