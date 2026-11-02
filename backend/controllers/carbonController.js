import { calculateEmissions } from "../utils/carbonCalculator.js";

export const calculateCarbon = (req, res) => {
  const { electricityKwh, transport } = req.body;

  // Validate electricity
  if (
    typeof electricityKwh !== "number" ||
    !Number.isFinite(electricityKwh) ||
    electricityKwh < 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid electricity consumption.",
    });
  }

  // Validate transport array
  if (!Array.isArray(transport)) {
    return res.status(400).json({
      success: false,
      message: "Transport must be an array.",
    });
  }

  // Validate each journey
  const validModes = ["car", "bus", "bike", "metro"];

  for (const journey of transport) {
    if (
      !journey ||
      !validModes.includes(journey.mode) ||
      typeof journey.distanceKm !== "number" ||
      !Number.isFinite(journey.distanceKm) ||
      journey.distanceKm < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid transport mode or distance.",
      });
    }
  }

  // Calculate emissions
  const result = calculateEmissions(electricityKwh, transport);

  res.json({
    success: true,
    message: "Carbon footprint calculated successfully!",
    input: {
      electricityKwh,
      transport,
    },
    emissionBreakdown: result,
    unit: "kg CO2",
  });
};
