const crypto = require("crypto");

function matches(value, expected) {
  const valueBuffer = Buffer.from(value || "");
  const expectedBuffer = Buffer.from(expected || "");
  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

exports.login = (req, res) => {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUsername || !expectedPassword) return res.status(503).json({ message: "Set ADMIN_USERNAME and ADMIN_PASSWORD in backend/.env" });
  if (!matches(username, expectedUsername) || !matches(password, expectedPassword)) {
    return res.status(401).json({ message: "Username or password is incorrect" });
  }

  req.session.regenerate((error) => {
    if (error) return res.status(500).json({ message: "Unable to create admin session" });
    req.session.adminUser = expectedUsername;
    req.session.save((saveError) => {
      if (saveError) return res.status(500).json({ message: "Unable to save admin session" });
      res.json({ authenticated: true, username: expectedUsername });
    });
  });
};

exports.session = (req, res) => {
  res.json({ authenticated: Boolean(req.session?.adminUser), username: req.session?.adminUser || null });
};

exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).json({ message: "Unable to end admin session" });
    res.clearCookie("libassi.sid");
    res.json({ authenticated: false });
  });
};