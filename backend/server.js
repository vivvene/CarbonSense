// 1. Import Express
import express from "express";
import carbonRoutes from "./routes/carbonRoutes.js";

// 2. Create an Express application
const app = express();

// 3. Define the port
const PORT = 5000;

// 4. Middleware to read JSON data
app.use(express.json());
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
