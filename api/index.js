require("dotenv").config();
const mongoose = require("mongoose");
const app = require("../backend/app");

// One connection per cold start, reused across invocations on warm lambdas.
let connectionPromise = null;
const connectOnce = () => {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
        maxPoolSize: 5,
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }
  return connectionPromise;
};

module.exports = async (request, response) => {
  try {
    await connectOnce();
  } catch {
    return response.status(503).json({ message: "Database unavailable" });
  }
  app(request, response);
};
