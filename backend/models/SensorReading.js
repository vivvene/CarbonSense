import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: true,
      trim: true,
    },

    campusId: {
      type: String,
      required: true,
      trim: true,
    },

    parameter: {
      type: String,
      enum: ["electricity"],
      default: "electricity",
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      default: "kWh",
    },

    carbonKg: {
      type: Number,
      min: 0,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    source: {
      type: String,
      enum: ["simulated", "iot"],
      default: "simulated",
    },
  },
  { timestamps: true },
);

// Index for faster campus-wise sensor queries
sensorReadingSchema.index({ campusId: 1, timestamp: -1 });

// Create model
const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);

export default SensorReading;
