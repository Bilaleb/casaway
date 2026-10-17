const Feedback = require("../models/Feedback");
const { KINDS } = Feedback;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const reject = (res, message) => res.status(400).json({ error: message });

/**
 * POST /api/feedback — store a community route/station report.
 *
 * Validates every field before touching the database and returns 503 when
 * storage is unreachable, so the client can queue the report offline and
 * retry instead of silently losing it.
 */
exports.submitFeedback = async (req, res) => {
  const body = req.body || {};
  const kind = typeof body.kind === "string" ? body.kind.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim().slice(0, 160) : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const context = body.context && typeof body.context === "object" && !Array.isArray(body.context)
    ? {
        path: String(body.context.path || "").slice(0, 300),
        userAgent: String(body.context.userAgent || "").slice(0, 300),
      }
    : {};

  if (!KINDS.includes(kind)) return reject(res, `kind must be one of: ${KINDS.join(", ")}`);
  if (details.length < 10) return reject(res, "details must be at least 10 characters");
  if (details.length > 2000) return reject(res, "details must be at most 2000 characters");
  if (email && (email.length > 200 || !EMAIL_PATTERN.test(email))) return reject(res, "email must be a valid address");

  try {
    const stored = await Feedback.create({ kind, subject, details, email, context });
    return res.status(201).json({ ok: true, id: stored._id });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    // Database unreachable (e.g. Atlas IP whitelist) — the client queues and retries.
    return res.status(503).json({ error: "Could not store feedback right now" });
  }
};