import SensorReading from "../models/SensorReading.js";
import { emissionFactors } from "../data/emissionFactors.js";

export const generateSimulatedReadings = async (
  campusId = "TIU_001",
  count = 10,
) => {
  const readings = [];

  for (let i = 0; i < count; i++) {
    // Simulated electricity consumption in kWh
    const value = Number((1.5 + Math.random() * 3.5).toFixed(2));

    const carbonKg = Number((value * emissionFactors.electricity).toFixed(4));

    const reading = {
      sensorId: "SIM_001",
      campusId,
      parameter: "electricity",
      value,
      unit: "kWh",
      carbonKg,
      timestamp: new Date(Date.now() - i * 60000),
      source: "simulated",
    };

    readings.push(reading);
  }

  return await SensorReading.insertMany(readings);
};
