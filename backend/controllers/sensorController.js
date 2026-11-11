import SensorReading from "../models/SensorReading.js";
import { emissionFactors } from "../data/emissionFactors.js";
import { generateSimulatedReadings } from "../services/sensorSimulator.js";

// POST: Save a sensor reading
export const addSensorReading = async (req, res) => {
  try {
    const { sensorId, campusId, value, timestamp, source } = req.body;

    if (!sensorId || !campusId || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "sensorId, campusId and value are required.",
      });
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Value must be a valid non-negative number.",
      });
    }

    if (source && !["simulated", "iot"].includes(source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source.",
      });
    }

    const carbonKg = Number(
      (numericValue * emissionFactors.electricity).toFixed(4),
    );

    const reading = await SensorReading.create({
      sensorId,
      campusId,
      value: numericValue,
      carbonKg,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: source || "simulated",
    });

    return res.status(201).json({
      success: true,
      message: "Sensor reading saved successfully.",
      data: reading,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Retrieve campus sensor readings
export const getSensorReadings = async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 1000);

    const readings = await SensorReading.find({
      campusId: req.params.campusId,
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST: Generate simulated readings
export const simulateSensorReadings = async (req, res) => {
  try {
    const campusId = req.body.campusId || "TIU_001";
    const count = Number(req.body.count) || 10;

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      return res.status(400).json({
        success: false,
        message: "Count must be between 1 and 100.",
      });
    }

    const readings = await generateSimulatedReadings(campusId, count);

    return res.status(201).json({
      success: true,
      message: "Simulated readings generated successfully.",
      count: readings.length,
      data: readings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET: Campus consumption and carbon analytics
export const getCampusAnalytics = async (req, res) => {
  try {
    const campusId = req.params.campusId;

    const result = await SensorReading.aggregate([
      { $match: { campusId } },
      {
        $group: {
          _id: null,
          totalReadings: { $sum: 1 },
          totalConsumption: { $sum: "$value" },
          totalCarbon: { $sum: "$carbonKg" },
          averageConsumption: { $avg: "$value" },
          highestConsumption: { $max: "$value" },
          lowestConsumption: { $min: "$value" },
        },
      },
    ]);

    const analytics = result[0] || {
      totalReadings: 0,
      totalConsumption: 0,
      totalCarbon: 0,
      averageConsumption: 0,
      highestConsumption: 0,
      lowestConsumption: 0,
    };

    delete analytics._id;

    return res.status(200).json({
      success: true,
      campusId,
      data: analytics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
