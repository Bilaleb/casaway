const express = require("express");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const orderController = require("./controllers/order.controller");
const app = express();
const imageDirectory = path.join(__dirname, "..", "libassi images");
const clientBuildDirectory = path.join(__dirname, "..", "frontend", "client", "dist");
const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? null : "libassi-development-session-secret");
const mongoClientPromise = mongoose.connection.asPromise().then(() => mongoose.connection.getClient());

if (!sessionSecret) throw new Error("SESSION_SECRET is required in production");

app.post("/api/orders/stripe-webhook", express.raw({ type: "application/json" }), orderController.handleStripeWebhook);
app.use(express.json());
app.use(session({
	name: "libassi.sid",
	secret: sessionSecret,
	store: new MongoStore({ clientPromise: mongoClientPromise, collectionName: "libassi_sessions" }),
	resave: false,
	saveUninitialized: false,
	cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 },
}));
app.use("/images", (req, res, next) => {
	let decodedPath;
	try {
		decodedPath = decodeURIComponent(req.path);
	} catch {
		return res.status(400).end();
	}
	if (decodedPath.startsWith("/enhanced/")) return next();
	const imageName = path.parse(path.basename(decodedPath)).name;
	const enhancedImage = path.join(imageDirectory, "enhanced", `${imageName}.webp`);
	res.sendFile(enhancedImage, { headers: { "Cache-Control": "public, max-age=31536000, immutable" } }, (error) => {
		if (error && !res.headersSent) next();
	});
});
app.use("/images", express.static(imageDirectory));

// routes
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/categories", require("./routes/category.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.use(express.static(clientBuildDirectory));
app.use((req, res, next) => {
	if (req.method !== "GET" || req.path === "/api" || req.path.startsWith("/api/") || req.path === "/images" || req.path.startsWith("/images/")) return next();
	const clientEntry = path.join(clientBuildDirectory, "index.html");
	if (!fs.existsSync(clientEntry)) return next();
	res.sendFile(clientEntry, (error) => {
		if (error && !res.headersSent) next();
	});
});

module.exports = app;