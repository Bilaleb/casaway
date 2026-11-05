const { timingSafeEqual } = require("node:crypto");

module.exports = function requireRouteWriteToken(req, res, next) {
  const expected = process.env.ROUTE_WRITE_TOKEN;
  if (!expected) {
    return res.status(503).json({ message: "Route ingestion is disabled" });
  }

  const authorization = req.get("authorization") || "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) {
    return res.status(401).json({ message: "A bearer token is required" });
  }

  const supplied = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(expected);
  if (supplied.length !== expectedBuffer.length || !timingSafeEqual(supplied, expectedBuffer)) {
    return res.status(401).json({ message: "Invalid bearer token" });
  }

  return next();
};