export const emissionFactors = {
  // kg CO2 per kWh
  electricity: 0.675,

  // Transport emission factors
  transport: {
    // kg CO2 per passenger-km
    bus: 0.015161,

    // kg CO2 per vehicle-km
    petrolCar: 0.127,
    dieselCar: 0.113,
    twoWheeler: 0.0319,

    // Derived CNG auto factor:
    // 0.10768 kg CO2/vehicle-km divided by
    // assumed average occupancy of 3 passengers
    auto: 0.035893,

    // kg CO2 per passenger-km
    metro: 0.0118,

    walking: 0,
    cycling: 0,
  },
};
