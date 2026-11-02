const startButton = document.getElementById("startButton");
const welcomeSection = document.getElementById("welcomeSection");
const formSection = document.getElementById("formSection");

const carbonForm = document.getElementById("carbonForm");
const modeSelect = document.getElementById("mode");
const individualSection = document.getElementById("individualSection");
const campusSection = document.getElementById("campusSection");
const result = document.getElementById("result");

// Emission factors in kg CO2e per unit.
// Electricity factor: 0.675 kg CO2e per kWh.
// Transport factors are provisional reference estimates.
const EMISSION_FACTORS = {
    electricity: 0.675,
    bus: 0.104,
    petrolCar: 0.209,
    dieselCar: 0.213,
    twoWheeler: 0.113,
    auto: 0.17,
    metro: 0.035,
    walking: 0,
    cycling: 0
};

const TRANSPORT_LABELS = {
    bus: "Bus",
    petrolCar: "Petrol car",
    dieselCar: "Diesel car",
    twoWheeler: "Two-wheeler",
    auto: "Auto-rickshaw",
    metro: "Metro / Train",
    walking: "Walking",
    cycling: "Cycling"
};

// Show the calculator when Get Started is clicked.
startButton.addEventListener("click", function () {
    welcomeSection.hidden = true;
    formSection.hidden = false;
});

// Switch between Individual and Campus modes.
function updateMode() {
    const isCampus = modeSelect.value === "campus";

    individualSection.hidden = isCampus;
    campusSection.hidden = !isCampus;

    individualSection.querySelectorAll("input, select").forEach(field => {
        field.disabled = isCampus;
    });

    campusSection.querySelectorAll("input, select").forEach(field => {
        field.disabled = !isCampus;
    });

    result.replaceChildren();
}

modeSelect.addEventListener("change", updateMode);
updateMode();

// Read numerical input safely.
function getNumber(id) {
    const field = document.getElementById(id);

    return field.value.trim() === ""
        ? 0
        : Number(field.value);
}

// Display validation errors.
function showError(message) {
    result.textContent = message;
    result.className = "result-error";
}

// Add an emissions line to the results.
function addResultLine(container, label, value) {
    const paragraph = document.createElement("p");

    paragraph.textContent =
        `${label}: ${value.toFixed(2)} kg CO₂e`;

    container.appendChild(paragraph);
}

// Display the final calculation.
function displayResults(
    electricityEmissions,
    transportEmissions,
    transportBreakdown = {}
) {
    const total = electricityEmissions + transportEmissions;

    result.replaceChildren();
    result.className = "result-card";

    const heading = document.createElement("h3");
    heading.textContent = "Your Monthly Carbon Footprint";
    result.appendChild(heading);

    const totalLine = document.createElement("p");
    totalLine.className = "total-emissions";
    totalLine.textContent = `${total.toFixed(2)} kg CO₂e`;

    result.appendChild(totalLine);

    addResultLine(
        result,
        "Electricity emissions",
        electricityEmissions
    );

    const transportHeading = document.createElement("h4");
    transportHeading.textContent = "Transportation Breakdown";
    result.appendChild(transportHeading);

    if (modeSelect.value === "individual") {
        const selectedMode =
            document.getElementById("transportMode").value;

        addResultLine(
            result,
            TRANSPORT_LABELS[selectedMode],
            transportEmissions
        );
    } else {
        const modes = ["bus", "petrolCar", "twoWheeler", "metro"];

        modes.forEach(mode => {
            addResultLine(
                result,
                TRANSPORT_LABELS[mode],
                transportBreakdown[mode] || 0
            );
        });
    }

    addResultLine(
        result,
        "Total transport emissions",
        transportEmissions
    );

    const electricityShare = total > 0
        ? electricityEmissions / total * 100
        : 0;

    const transportShare = total > 0
        ? transportEmissions / total * 100
        : 0;

    const breakdown = document.createElement("p");

    breakdown.textContent =
        `Contribution: Electricity ${electricityShare.toFixed(1)}% | ` +
        `Transport ${transportShare.toFixed(1)}%`;

    result.appendChild(breakdown);

    const note = document.createElement("p");
    note.className = "result-note";

    note.textContent =
        "Estimates depend on the emission factors and activity data used.";

    result.appendChild(note);
}

// Calculate emissions when the form is submitted.
carbonForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const electricity = getNumber("electricity");

    if (!Number.isFinite(electricity) || electricity < 0) {
        showError("Enter a valid, non-negative electricity value.");
        return;
    }

    const electricityEmissions =
        electricity * EMISSION_FACTORS.electricity;

    let transportEmissions = 0;
    let transportBreakdown = {};

    // INDIVIDUAL MODE
    if (modeSelect.value === "individual") {
        const transportMode =
            document.getElementById("transportMode").value;

        const distance = getNumber("distance");
        const travelDays = getNumber("travelDays");

        if (
            !Number.isFinite(distance) ||
            distance < 0 ||
            !Number.isFinite(travelDays) ||
            travelDays < 0 ||
            travelDays > 31
        ) {
            showError("Enter valid distance and travel-day values.");
            return;
        }

        transportEmissions =
            distance *
            travelDays *
            EMISSION_FACTORS[transportMode];

    }

    // CAMPUS MODE
    else {
        const operatingDays = getNumber("campusDays");

        if (
            !Number.isFinite(operatingDays) ||
            operatingDays < 0 ||
            operatingDays > 31
        ) {
            showError("Enter campus operating days from 0 to 31.");
            return;
        }

        const campusModes = [
            {
                count: "busCount",
                distance: "busDistance",
                factor: "bus"
            },
            {
                count: "carCount",
                distance: "carDistance",
                factor: "petrolCar"
            },
            {
                count: "bikeCount",
                distance: "bikeDistance",
                factor: "twoWheeler"
            },
            {
                count: "metroCount",
                distance: "metroDistance",
                factor: "metro"
            }
        ];

        for (const item of campusModes) {
            const commuters = getNumber(item.count);
            const distance = getNumber(item.distance);

            if (
                !Number.isFinite(commuters) ||
                commuters < 0 ||
                !Number.isInteger(commuters) ||
                !Number.isFinite(distance) ||
                distance < 0
            ) {
                showError(
                    "Check that commuter counts are whole numbers " +
                    "and distances are non-negative."
                );
                return;
            }

            const modeEmissions =
                commuters *
                distance *
                operatingDays *
                EMISSION_FACTORS[item.factor];

            transportBreakdown[item.factor] = modeEmissions;

            transportEmissions += modeEmissions;
        }
    }

    displayResults(
        electricityEmissions,
        transportEmissions,
        transportBreakdown
    );
});