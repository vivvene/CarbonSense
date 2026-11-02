console.log("Simulator JS Loaded");

function renderSimulator() {

    const content = document.getElementById("simulatorContent");

    if (!latestCarbonData) {
        content.innerHTML = `
            <p>Please calculate your carbon footprint first.
            Your simulation options will appear here.</p>
        `;
        return;
    }

    const data = latestCarbonData;

    content.innerHTML = `
        <h3>Experiment with Your Carbon Footprint</h3>

        <p>
            ${data.mode === "individual"
                ? "Explore how changes in your personal habits can reduce emissions."
                : "Explore how campus-wide changes can reduce emissions."}
        </p>

        <div class="simulator-control">
            <label for="electricityReduction">
                Electricity consumption reduction:
                <strong id="electricityValue">0%</strong>
            </label>
            <input type="range" id="electricityReduction"
                min="0" max="80" value="0">
        </div>

        <div class="simulator-control">
            <label for="transportReduction">
                Transport emissions reduction:
                <strong id="transportValue">0%</strong>
            </label>
            <input type="range" id="transportReduction"
                min="0" max="80" value="0">
        </div>

        <div class="simulation-results">
            <div class="simulation-card">
                <h4>Current Emissions</h4>
                <p id="currentEmissions"></p>
            </div>

            <div class="simulation-card">
                <h4>Projected Emissions</h4>
                <p id="projectedEmissions"></p>
            </div>

            <div class="simulation-card">
                <h4>Potential Savings</h4>
                <p id="emissionsSaved"></p>
            </div>
        </div>

        <p id="simulationMessage"></p>
    `;

    const electricitySlider =
        document.getElementById("electricityReduction");

    const transportSlider =
        document.getElementById("transportReduction");

    function updateSimulation() {

        const electricityPercent =
            Number(electricitySlider.value);

        const transportPercent =
            Number(transportSlider.value);

        const projectedElectricity =
            data.electricityEmissions *
            (1 - electricityPercent / 100);

        const projectedTransport =
            data.transportEmissions *
            (1 - transportPercent / 100);

        const projectedTotal =
            projectedElectricity + projectedTransport;

        const saved =
            data.total - projectedTotal;

        document.getElementById("electricityValue").textContent =
            electricityPercent + "%";

        document.getElementById("transportValue").textContent =
            transportPercent + "%";

        document.getElementById("currentEmissions").textContent =
            data.total.toFixed(2) + " kg CO₂e";

        document.getElementById("projectedEmissions").textContent =
            projectedTotal.toFixed(2) + " kg CO₂e";

        document.getElementById("emissionsSaved").textContent =
            saved.toFixed(2) + " kg CO₂e";

        document.getElementById("simulationMessage").textContent =
            saved > 0
                ? "Great! Your changes could reduce monthly emissions by " +
                  saved.toFixed(2) + " kg CO₂e."
                : "Adjust the sliders to explore possible emission reductions.";
    }

    electricitySlider.addEventListener("input", updateSimulation);
    transportSlider.addEventListener("input", updateSimulation);

    updateSimulation();
}

// Open the simulator when its navigation button is clicked.
const simulatorButton =
    document.querySelector('[data-section="simulatorSection"]');

if (simulatorButton) {
    simulatorButton.addEventListener("click", renderSimulator);
}