export const emissionFactors = {
  // kg CO2 per kWh
  electricity: 0.675,

  // kg CO2 per km, except bus which is per passenger-km
  transport: {
    bus: 0.015161,
    petrolCar: 0.127,
    twoWheeler: 0.0319,
    walking: 0,
    cycling: 0,

    // Factors still need verification from the team
    dieselCar: null,
    auto: null,
    metro: null,
  },
};
