// 1. Import Express
import express from "express";
import carbonRoutes from "./routes/carbonRoutes.js";

// 2. Create an Express application
const app = express();

// 3. Define the port
const PORT = 5000;

// 4. Middleware to read JSON data
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow local development servers
  if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  // Handle browser preflight requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use("/api/carbon", carbonRoutes);

// 5. Create our first route
app.get("/", (req, res) => {
  res.send("Welcome to CarbonSense Backend! 🌱");
});

// 6. Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CarbonSense server is running!",
  });
});

app.get("/api/project", (req, res) => {
  res.json({
    project: "CarbonSense",
    purpose: "Carbon Footprint Tracking",
    version: "1.0.0",
    status: "Under Development",
  });
});

app.post("/api/test", (req, res) => {
  // Receive data from the frontend
  const userData = req.body;

  // Send the received data back
  res.json({
    message: "Data received successfully!",
    receivedData: userData,
  });
});

// 7. Start the server
app.listen(PORT, () => {
  console.log(`CarbonSense server running at http://localhost:${PORT}`);
});
