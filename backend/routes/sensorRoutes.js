import express from "express";

import {
  addSensorReading,
  getSensorReadings,
  simulateSensorReadings,
  getCampusAnalytics,
} from "../controllers/sensorController.js";

const router = express.Router();

// POST routes
router.post("/", addSensorReading);
router.post("/simulate", simulateSensorReadings);

// GET routes
router.get("/analytics/:campusId", getCampusAnalytics);
router.get("/:campusId", getSensorReadings);

export default router;
