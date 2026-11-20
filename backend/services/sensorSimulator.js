import SensorReading from "../models/SensorReading.js";
import { emissionFactors } from "../data/emissionFactors.js";

const CAMPUS_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;
const SENSOR_ID = "SIM_001";

// Assumed hourly campus electricity consumption (kWh)
const HOURLY_PROFILE = [
  { start: 0, end: 6, consumption: 35 },
  { start: 6, end: 9, consumption: 55 },
  { start: 9, end: 13, consumption: 90 },
  { start: 13, end: 17, consumption: 100 },
  { start: 17, end: 20, consumption: 75 },
  { start: 20, end: 24, consumption: 50 },
];

// Get campus date, hour and weekday using Kolkata time
const getCampusTimeParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: CAMPUS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date);

  const result = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return {
    hour: Number(result.hour),
    weekday: result.weekday,
    dateKey: `${result.year}-${result.month}-${result.day}`,
  };
};

// Get the beginning of the current Kolkata-local hour
const getCampusHourStart = (date) => {
  const parts = getCampusTimeParts(date);

  const localHourAsUTC = Date.UTC(
    Number(parts.dateKey.slice(0, 4)),
    Number(parts.dateKey.slice(5, 7)) - 1,
    Number(parts.dateKey.slice(8, 10)),
    parts.hour,
  );

  return new Date(localHourAsUTC - IST_OFFSET_MINUTES * 60 * 1000);
};

// Generate normally distributed random variation
const randomNormal = (mean = 0, standardDeviation = 1) => {
  const u1 = Math.max(Math.random(), 0.000001);
  const u2 = Math.random();

  const standardNormal =
    Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return mean + standardDeviation * standardNormal;
};

// Calculate assumed hourly campus consumption
const getHourlyTarget = (date, dailyVariation) => {
  const { hour, weekday } = getCampusTimeParts(date);

  const profile = HOURLY_PROFILE.find(
    (item) => hour >= item.start && hour < item.end,
  );

  const isWeekend = weekday === "Sat" || weekday === "Sun";

  const weekendMultiplier = isWeekend ? 0.65 : 1;

  const hourlyNoise = randomNormal(0, 4);

  const target =
    profile.consumption * weekendMultiplier + dailyVariation + hourlyNoise;

  return Math.max(10, target);
};

// Distribute hourly consumption across 60 minute-level readings.
// The sum of all 60 readings equals the rounded hourly target.
const distributeHourlyConsumption = (hourlyTarget) => {
  const targetInCents = Math.round(hourlyTarget * 100);

  const variations = Array.from(
    { length: 60 },
    () => 0.8 + Math.random() * 0.4,
  );

  const totalVariation = variations.reduce((sum, value) => sum + value, 0);

  const readings = [];
  let distributedCents = 0;

  for (let i = 0; i < 60; i++) {
    let valueInCents;

    if (i === 59) {
      valueInCents = targetInCents - distributedCents;
    } else {
      valueInCents = Math.round(
        (targetInCents * variations[i]) / totalVariation,
      );

      distributedCents += valueInCents;
    }

    readings.push(valueInCents / 100);
  }

  return readings;
};

// Create database documents for one complete hour
const createHourlyReadings = (campusId, hourStart, dailyVariation) => {
  const hourlyTarget = getHourlyTarget(hourStart, dailyVariation);

  const minuteValues = distributeHourlyConsumption(hourlyTarget);

  return minuteValues.map((value, minute) => {
    const carbonKg = Number((value * emissionFactors.electricity).toFixed(4));

    return {
      sensorId: SENSOR_ID,
      campusId,
      parameter: "electricity",
      value,
      unit: "kWh",
      carbonKg,
      timestamp: new Date(hourStart.getTime() + minute * 60000),
      source: "simulated",
    };
  });
};

// Generate a small batch for the existing dashboard simulator
export const generateSimulatedReadings = async (
  campusId = "TIU_001",
  count = 10,
) => {
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error("Count must be between 1 and 100.");
  }

  const now = new Date();
  const currentHour = getCampusHourStart(now);

  const currentMinute = Math.floor(
    (now.getTime() - currentHour.getTime()) / 60000,
  );

  const dailyVariation = randomNormal(0, 5);

  const hourlyReadings = createHourlyReadings(
    campusId,
    currentHour,
    dailyVariation,
  );

  const availableCount = Math.min(count, currentMinute + 1);

  const readings = hourlyReadings.slice(
    currentMinute - availableCount + 1,
    currentMinute + 1,
  );

  return await SensorReading.insertMany(readings);
};

// Generate chronological historical readings for forecasting
export const generateHistoricalReadings = async (
  campusId = "TIU_001",
  hours = 168,
) => {
  if (!Number.isInteger(hours) || hours < 1 || hours > 720) {
    throw new Error("Hours must be between 1 and 720.");
  }

  const endTime = getCampusHourStart(new Date());

  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  // Remove only previously generated readings from this
  // simulator and historical time window. IoT records are untouched.
  await SensorReading.deleteMany({
    campusId,
    sensorId: SENSOR_ID,
    source: "simulated",
    timestamp: {
      $gte: startTime,
      $lt: endTime,
    },
  });

  const readings = [];
  const dailyVariations = new Map();

  for (
    let hourStart = new Date(startTime);
    hourStart < endTime;
    hourStart = new Date(hourStart.getTime() + 60 * 60 * 1000)
  ) {
    const { dateKey } = getCampusTimeParts(hourStart);

    if (!dailyVariations.has(dateKey)) {
      dailyVariations.set(dateKey, randomNormal(0, 5));
    }

    const hourlyReadings = createHourlyReadings(
      campusId,
      hourStart,
      dailyVariations.get(dateKey),
    );

    readings.push(...hourlyReadings);
  }

  return await SensorReading.insertMany(readings);
};
