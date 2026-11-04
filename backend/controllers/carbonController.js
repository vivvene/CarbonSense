import { calculateEmissions } from "../utils/carbonCalculator.js";
import { emissionFactors } from "../data/emissionFactors.js";

export const calculateCarbon = (req, res) => {
  try {
    const { electricityKwh, transport } = req.body;

    // Validate electricity consumption
    if (
      typeof electricityKwh !== "number" ||
      !Number.isFinite(electricityKwh) ||
      electricityKwh < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Electricity consumption must be a non-negative number.",
      });
    }

    // Validate transport input
    if (!Array.isArray(transport)) {
      return res.status(400).json({
        success: false,
        message: "Transport must be an array.",
      });
    }

    // Validate every journey
    for (const journey of transport) {
      if (
        !journey ||
        typeof journey.mode !== "string" ||
        !Object.hasOwn(emissionFactors.transport, journey.mode) ||
        typeof journey.distanceKm !== "number" ||
        !Number.isFinite(journey.distanceKm) ||
        journey.distanceKm < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid transport mode or distance.",
        });
      }

      // Reject modes without verified emission factors
      if (emissionFactors.transport[journey.mode] === null) {
        return res.status(422).json({
          success: false,
          message: `Emission factor unavailable for ${journey.mode}.`,
        });
      }
    }

    const result = calculateEmissions(electricityKwh, transport);

    return res.json({
      success: true,
      message: "Carbon footprint calculated successfully!",
      input: { electricityKwh, transport },
      emissionBreakdown: result,
      unit: "kg CO2",
    });
  } catch (error) {
    console.error("Carbon calculation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate carbon emissions.",
    });
  }
};
