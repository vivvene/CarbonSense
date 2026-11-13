import SensorReading from "../models/SensorReading.js";
import { emissionFactors } from "../data/emissionFactors.js";
import {
  generateSimulatedReadings,
  generateHistoricalReadings,
} from "../services/sensorSimulator.js";
// Get the beginning of the current hour in Kolkata time
const getKolkataHourStart = (date = new Date()) => {
  const shifted = new Date(date.getTime() + 330 * 60 * 1000);
  shifted.setUTCMinutes(0, 0, 0);
  return new Date(shifted.getTime() - 330 * 60 * 1000);
};

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

// GET: Retrieve hourly electricity consumption for forecasting
export const getHourlySensorReadings = async (req, res) => {
  try {
    const { campusId } = req.params;
    const hours = Number(req.query.hours) || 168;

    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      return res.status(400).json({
        success: false,
        message: "Hours must be between 1 and 720.",
      });
    }

    // Align the query window to complete Kolkata-local hours
    const endTime = getKolkataHourStart();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const hourlyReadings = await SensorReading.aggregate([
      {
        $match: {
          campusId,
          parameter: "electricity",
          timestamp: {
            $gte: startTime,
            $lt: endTime,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "hour",
              timezone: "Asia/Kolkata",
            },
          },
          consumptionKwh: { $sum: "$value" },
          carbonKg: { $sum: "$carbonKg" },
          readingCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: "$_id",
          consumptionKwh: 1,
          carbonKg: 1,
          readingCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      campusId,
      periodHours: hours,
      count: hourlyReadings.length,
      data: hourlyReadings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST: Generate historical simulated readings for forecasting
export const generateHistoricalSensorReadings = async (req, res) => {
  try {
    const { campusId } = req.params;
    const hours = Number(req.body.hours) || 168;

    if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
      return res.status(400).json({
        success: false,
        message: "Hours must be between 1 and 720.",
      });
    }

    const readings = await generateHistoricalReadings(campusId, hours);

    return res.status(201).json({
      success: true,
      message: "Historical simulated readings generated successfully.",
      campusId,
      periodHours: hours,
      expectedReadings: hours * 60,
      insertedReadings: readings.length,
      source: "simulated",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET: Generate next 24-hour electricity forecast using the ML API
export const getElectricityForecast = async (req, res) => {
  try {
    const { campusId } = req.params;
    const hours = Math.min(Math.max(Number(req.query.hours) || 168, 24), 720);

    // Use complete Kolkata-local hours only
    const endTime = getKolkataHourStart();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const hourlyReadings = await SensorReading.aggregate([
      {
        $match: {
          campusId,
          parameter: "electricity",
          timestamp: {
            $gte: startTime,
            $lt: endTime,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: "$timestamp",
              unit: "hour",
              timezone: "Asia/Kolkata",
            },
          },
          consumptionKwh: { $sum: "$value" },
          readingCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: "$_id",
          consumptionKwh: 1,
          readingCount: 1,
        },
      },
    ]);

    // Only use complete hourly buckets
    const completeReadings = hourlyReadings.filter(
      (reading) => reading.readingCount === 60,
    );

    if (completeReadings.length < 24) {
      return res.status(400).json({
        success: false,
        message: "At least 24 complete hourly readings are required.",
        availableReadings: completeReadings.length,
      });
    }

    // Verify that observations are exactly one hour apart
    for (let i = 1; i < completeReadings.length; i++) {
      const previous = new Date(completeReadings[i - 1].timestamp);
      const current = new Date(completeReadings[i].timestamp);

      if (current.getTime() - previous.getTime() !== 60 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: "Historical data contains missing hourly intervals.",
          previousTimestamp: previous.toISOString(),
          currentTimestamp: current.toISOString(),
        });
      }
    }

    const history = completeReadings.map((reading) => ({
      timestamp: new Date(reading.timestamp).toISOString(),
      consumption_kwh: reading.consumptionKwh,
    }));

    // Call the separate FastAPI ML service
    let mlResponse;

    try {
      mlResponse = await fetch(
        `${process.env.ML_SERVICE_URL || "http://127.0.0.1:8000"}/forecast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ history }),
          signal: AbortSignal.timeout(30000),
        },
      );
    } catch (error) {
      return res.status(503).json({
        success: false,
        message: "ML forecasting service is unavailable.",
        detail: error.message,
      });
    }

    const forecastResult = await mlResponse.json();

    if (!mlResponse.ok) {
      return res.status(mlResponse.status).json({
        success: false,
        message: "ML forecasting failed.",
        detail: forecastResult.detail || forecastResult,
      });
    }

    return res.status(200).json({
      success: true,
      campusId,
      historicalReadingsUsed: history.length,
      forecastHours: forecastResult.forecast_hours,
      forecast: forecastResult.forecast,
      source: "ML forecast based on historical readings",
      historicalDataSource: "simulated_or_recorded_sensor_readings",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
