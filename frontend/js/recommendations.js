console.log("Recommendations JS Loaded");

function updateRecommendations(data) {
  const content = document.getElementById("recommendationsContent");

  content.innerHTML = "";

  const heading = document.createElement("h3");
  heading.textContent = "Your Personalised Action Plan";
  content.appendChild(heading);

  const suggestions = [];

  if (data.electricityEmissions > 0) {
    suggestions.push([
      "Reduce electricity consumption",
      "Switch off unused lights, fans and appliances. Choose energy-efficient LED lighting.",
    ]);
  }

  if (data.mode === "individual") {
    const advice = {
      bus: [
        "Continue using public transport",
        "Buses generally produce fewer emissions per passenger than individual cars.",
      ],
      petrolCar: [
        "Reduce private car usage",
        "Try carpooling or public transport when practical.",
      ],
      dieselCar: [
        "Reduce private car usage",
        "Try carpooling or public transport when practical.",
      ],
      twoWheeler: [
        "Travel efficiently",
        "Maintain tyre pressure and avoid unnecessary trips.",
      ],
      auto: [
        "Choose shared transport",
        "Consider shared autos, buses or metro services.",
      ],
      metro: [
        "Continue using mass transit",
        "Metro and train travel can be efficient commuting choices.",
      ],
      walking: ["Keep walking!", "Walking is a low-emission way to travel."],
      cycling: ["Keep cycling!", "Cycling is a low-emission commuting option."],
    };

    if (advice[data.transportMode]) {
      suggestions.push(advice[data.transportMode]);
    }
  } else {
    const modes = data.transportBreakdown || [];

    const highestJourney = modes.reduce(
      (highest, current) =>
        current.emissions > highest.emissions ? current : highest,
      { mode: null, emissions: 0 },
    );

    const highest = highestJourney.mode;

    const advice = {
      bus: "Encourage more students and staff to use shared buses.",
      petrolCar: "Promote carpooling to reduce individual car journeys.",
      twoWheeler: "Encourage public transport, cycling and walking.",
      metro: "Promote metro connectivity and last-mile transport.",
    };

    if (data.transportEmissions > 0) {
      suggestions.push([
        "Improve campus commuting",
        advice[highest] || "Encourage sustainable commuting.",
      ]);
    }
  }

  suggestions.push([
    "Monitor your monthly footprint",
    "Compare monthly results to understand whether your reduction efforts are working.",
  ]);

  suggestions.forEach(([titleText, descriptionText]) => {
    const card = document.createElement("div");
    card.className = "recommendation-card";

    const title = document.createElement("h4");
    title.textContent = titleText;

    const description = document.createElement("p");
    description.textContent = descriptionText;

    card.appendChild(title);
    card.appendChild(description);

    content.appendChild(card);
  });
}
