import { emissionFactors } from "../data/emissionFactors.js";

export const calculateEmissions = (electricityKwh, transport) => {
  const electricityEmissions = electricityKwh * emissionFactors.electricity;

  let transportEmissions = 0;

  const transportBreakdown = transport.map((journey) => {
    const factor = emissionFactors.transport[journey.mode];

    // Prevent calculations with missing emission factors
    if (typeof factor !== "number" || !Number.isFinite(factor)) {
      throw new Error(
        `Emission factor unavailable for transport mode: ${journey.mode}`,
      );
    }

    const emissions = journey.distanceKm * factor;

    transportEmissions += emissions;

    return {
      mode: journey.mode,
      distanceKm: journey.distanceKm,
      emissionFactor: factor,
      emissions,
    };
  });

  const totalEmissions = electricityEmissions + transportEmissions;

  return {
    electricityEmissions,
    transportEmissions,
    transportBreakdown,
    totalEmissions,
  };
};
