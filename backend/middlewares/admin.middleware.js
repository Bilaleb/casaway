module.exports = (req, res, next) => {
  if (!req.session?.adminUser) return res.status(401).json({ message: "Admin login required" });
  next();
};