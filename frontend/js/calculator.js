console.log("CarbonSense Calculator Loaded");

// ========================================
// EMISSION FACTORS
// ========================================

const TRANSPORT_LABELS = {
  bus: "Bus",
  petrolCar: "Petrol Car",
  dieselCar: "Diesel Car",
  twoWheeler: "Two-wheeler",
  auto: "Auto-rickshaw",
  metro: "Metro / Train",
  walking: "Walking",
  cycling: "Cycling",
};

// ========================================
// HTML ELEMENTS
// ========================================

const carbonForm = document.getElementById("carbonForm");
const modeSelect = document.getElementById("mode");

const individualSection = document.getElementById("individualSection");

const campusSection = document.getElementById("campusSection");

const result = document.getElementById("result");

let latestCarbonData = null;

// ========================================
// MODE SWITCHING
// ========================================

function updateMode() {
  const isCampus = modeSelect.value === "campus";

  individualSection.hidden = isCampus;
  campusSection.hidden = !isCampus;

  individualSection
    .querySelectorAll("input, select")
    .forEach((field) => (field.disabled = isCampus));

  campusSection
    .querySelectorAll("input, select")
    .forEach((field) => (field.disabled = !isCampus));

  result.replaceChildren();
}

modeSelect.addEventListener("change", updateMode);

updateMode();

// ========================================
// HELPER FUNCTIONS
// ========================================

function getNumber(id) {
  const field = document.getElementById(id);

  if (!field) {
    throw new Error("Missing input element: " + id);
  }

  return field.value.trim() === "" ? 0 : Number(field.value);
}

function showError(message) {
  result.replaceChildren();

  result.className = "result-error";

  result.textContent = message;
}

function addResultLine(container, label, value) {
  const paragraph = document.createElement("p");

  paragraph.textContent = `${label}: ${value.toFixed(2)} kg CO₂e`;

  container.appendChild(paragraph);
}

// ========================================
// DISPLAY RESULTS
// ========================================

function displayResults(data) {
  result.replaceChildren();

  result.className = "result-card";

  const heading = document.createElement("h3");

  heading.textContent =
    data.mode === "campus"
      ? "Monthly Campus Carbon Footprint"
      : "Your Monthly Carbon Footprint";

  result.appendChild(heading);

  const total = document.createElement("p");

  total.className = "total-emissions";

  total.textContent = data.total.toFixed(2) + " kg CO₂e";

  result.appendChild(total);

  addResultLine(result, "Electricity emissions", data.electricityEmissions);

  const transportHeading = document.createElement("h4");

  transportHeading.textContent = "Transportation Breakdown";

  result.appendChild(transportHeading);

  if (data.mode === "individual") {
    addResultLine(
      result,
      TRANSPORT_LABELS[data.transportMode],
      data.transportEmissions,
    );
  } else {
    Object.keys(data.transportBreakdown).forEach((mode) => {
      addResultLine(
        result,
        TRANSPORT_LABELS[mode],
        data.transportBreakdown[mode],
      );
    });
  }

  addResultLine(result, "Total transport emissions", data.transportEmissions);

  const contribution = document.createElement("p");

  contribution.textContent =
    `Electricity: ${data.electricityShare.toFixed(1)}% | ` +
    `Transport: ${data.transportShare.toFixed(1)}%`;

  result.appendChild(contribution);

  const note = document.createElement("p");

  note.className = "result-note";

  note.textContent =
    "Results are estimates based on the emission factors used.";

  result.appendChild(note);
}

// ========================================
// CALCULATE FOOTPRINT
// ========================================

carbonForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  try {
    const electricity = getNumber("electricity");

    if (!Number.isFinite(electricity) || electricity < 0) {
      showError("Enter a valid, non-negative electricity value.");
      return;
    }

    let transport = [];
    let transportMode = null;
    let transportBreakdown = {};

    if (modeSelect.value === "individual") {
      transportMode = document.getElementById("transportMode").value;

      const distance = getNumber("distance");
      const travelDays = getNumber("travelDays");

      if (!Number.isFinite(distance) || distance < 0) {
        showError("Enter a valid, non-negative distance.");
        return;
      }

      if (
        !Number.isFinite(travelDays) ||
        !Number.isInteger(travelDays) ||
        travelDays < 0 ||
        travelDays > 31
      ) {
        showError("Travel days must be a whole number between 0 and 31.");
        return;
      }

      transportBreakdown[transportMode] = 0;

      if (distance > 0 && travelDays > 0) {
        transport.push({
          mode: transportMode,
          distanceKm: distance * travelDays,
        });
      }
    } else if (modeSelect.value === "campus") {
      const operatingDays = getNumber("campusDays");

      if (
        !Number.isFinite(operatingDays) ||
        !Number.isInteger(operatingDays) ||
        operatingDays < 0 ||
        operatingDays > 31
      ) {
        showError("Campus days must be a whole number between 0 and 31.");
        return;
      }

      const campusModes = [
        ["busCount", "busDistance", "bus"],
        ["carCount", "carDistance", "petrolCar"],
        ["bikeCount", "bikeDistance", "twoWheeler"],
        ["metroCount", "metroDistance", "metro"],
      ];

      for (const [countId, distanceId, mode] of campusModes) {
        const commuters = getNumber(countId);
        const distance = getNumber(distanceId);

        if (!Number.isInteger(commuters) || commuters < 0) {
          showError("Commuter counts must be whole, non-negative numbers.");
          return;
        }

        if (!Number.isFinite(distance) || distance < 0) {
          showError("Enter valid commuting distances.");
          return;
        }

        transportBreakdown[mode] = 0;

        if (commuters > 0 && distance > 0 && operatingDays > 0) {
          transport.push({
            mode,
            distanceKm: commuters * distance * operatingDays,
          });
        }
      }
    } else {
      showError("Please select a valid calculation mode.");
      return;
    }

    result.replaceChildren();
    result.className = "result-card";
    result.textContent = "Calculating your carbon footprint...";

    const response = await fetch(
      `${window.CARBONSENSE_API_URL}/api/carbon/calculate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          electricityKwh: electricity,
          transport,
        }),
      },
    );

    const apiData = await response.json();

    if (!response.ok || !apiData.success) {
      throw new Error(
        apiData.message || "The carbon calculation request failed.",
      );
    }

    const breakdown = apiData.emissionBreakdown;
    const electricityEmissions = breakdown.electricityEmissions;
    const transportEmissions = breakdown.transportEmissions;
    const total = breakdown.totalEmissions;

    for (const journey of breakdown.transportBreakdown) {
      transportBreakdown[journey.mode] =
        (transportBreakdown[journey.mode] || 0) + journey.emissions;
    }

    const electricityShare =
      total > 0 ? (electricityEmissions / total) * 100 : 0;

    const transportShare = total > 0 ? (transportEmissions / total) * 100 : 0;

    latestCarbonData = {
      mode: modeSelect.value,
      total,
      electricityEmissions,
      transportEmissions,
      transportBreakdown,
      transportMode,
      electricityShare,
      transportShare,
    };

    displayResults(latestCarbonData);

    if (typeof updateDashboard === "function") {
      updateDashboard(latestCarbonData);
    }

    if (typeof updateRecommendations === "function") {
      updateRecommendations(latestCarbonData);
    }
  } catch (error) {
    console.error("Carbon calculation error:", error);
    showError(error.message || "Unable to calculate your carbon footprint.");
  }
});
