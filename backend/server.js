import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import carbonRoutes from "./routes/carbonRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// JSON middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// API routes
app.use("/api/carbon", carbonRoutes);
app.use("/api/sensors", sensorRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.send("Welcome to CarbonSense Backend! 🌱");
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CarbonSense server is running!",
  });
});

// Project information
app.get("/api/project", (req, res) => {
  res.json({
    project: "CarbonSense",
    purpose: "Carbon Footprint Tracking",
    version: "1.0.0",
    status: "Under Development",
  });
});

// Test route
app.post("/api/test", (req, res) => {
  res.json({
    message: "Data received successfully!",
    receivedData: req.body,
  });
});

// Start server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
  }
};

startServer();
