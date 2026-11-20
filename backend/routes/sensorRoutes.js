import express from "express";

import {
  addSensorReading,
  getSensorReadings,
  simulateSensorReadings,
  getCampusAnalytics,
  getHourlySensorReadings,
  generateHistoricalSensorReadings,
  getElectricityForecast,
} from "../controllers/sensorController.js";

const router = express.Router();

// POST routes
router.post("/", addSensorReading);
router.post("/simulate", simulateSensorReadings);
router.post("/generate-history/:campusId", generateHistoricalSensorReadings);

// GET routes
router.get("/analytics/:campusId", getCampusAnalytics);
router.get("/hourly/:campusId", getHourlySensorReadings);
router.get("/forecast/:campusId", getElectricityForecast);
router.get("/:campusId", getSensorReadings);

export default router;
