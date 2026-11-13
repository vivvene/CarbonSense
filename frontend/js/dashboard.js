console.log("Dashboard JS Loaded");

// ========================================
// EXISTING CALCULATOR DASHBOARD
// ========================================

let dashboardData = null;
let sourceChart = null;
let transportChart = null;

// ========================================
// IOT DASHBOARD CONFIGURATION
// ========================================

const SENSOR_API = "http://localhost:5000/api/sensors";
const CAMPUS_ID = "TIU_001";
const REFRESH_INTERVAL = 30000;

let sensorReadings = [];
let sensorAnalytics = null;
let sensorChart = null;
let carbonTrendChart = null;
let selectedTimeRange = "24h";
let sensorRefreshTimer = null;
let sensorRequestInProgress = false;

// ========================================
// CAMPUS ML FORECAST CONFIGURATION
// ========================================

const FORECAST_API = `${SENSOR_API}/forecast`;
const ELECTRICITY_EMISSION_FACTOR = 0.675;

let campusForecast = null;
let forecastChart = null;
let forecastRequestInProgress = false;

// ========================================
// EXISTING DASHBOARD UPDATE
// ========================================

function updateDashboard(data) {
  dashboardData = data;

  const content = document.getElementById("dashboardContent");
  if (!content) return;

  content.innerHTML = `
        <div class="dashboard-cards">
            <div class="dashboard-card">
                <h3>Total Monthly Emissions</h3>
                <p>${Number(data.total || 0).toFixed(2)}</p>
                <span>kg CO₂e</span>
            </div>

            <div class="dashboard-card">
                <h3>Electricity Contribution</h3>
                <p>${Number(data.electricityShare || 0).toFixed(1)}%</p>
            </div>

            <div class="dashboard-card">
                <h3>Transport Contribution</h3>
                <p>${Number(data.transportShare || 0).toFixed(1)}%</p>
            </div>
        </div>

        <div class="dashboard-chart">
            <h3>Emissions by Source</h3>
            <div class="chart-container">
                <canvas id="sourceChart"></canvas>
            </div>
        </div>

        <div class="dashboard-chart">
            <h3>Transport Emissions Breakdown</h3>
            <div class="chart-container">
                <canvas id="transportChart"></canvas>
            </div>
        </div>

        <div class="dashboard-insight" id="dashboardInsight"></div>

        <div class="sensor-dashboard" id="sensorDashboard">
            ${getSensorDashboardMarkup()}
        </div>
    `;

  const highest =
    Number(data.electricityEmissions || 0) >=
    Number(data.transportEmissions || 0)
      ? "Electricity"
      : "Transportation";

  const insight = document.getElementById("dashboardInsight");

  if (insight) {
    insight.textContent = "Your highest emission source is " + highest + ".";
  }

  renderDashboardCharts();
  renderSensorDashboard();
}

// ========================================
// EXISTING CALCULATOR CHARTS
// ========================================

function renderDashboardCharts() {
  if (!dashboardData || typeof Chart === "undefined") return;

  const sourceCanvas = document.getElementById("sourceChart");
  const transportCanvas = document.getElementById("transportChart");

  if (!sourceCanvas || !transportCanvas) return;

  if (sourceChart) {
    sourceChart.destroy();
    sourceChart = null;
  }

  if (transportChart) {
    transportChart.destroy();
    transportChart = null;
  }

  sourceChart = new Chart(sourceCanvas, {
    type: "doughnut",
    data: {
      labels: ["Electricity", "Transportation"],
      datasets: [
        {
          data: [
            Number(dashboardData.electricityEmissions || 0),
            Number(dashboardData.transportEmissions || 0),
          ],
          backgroundColor: ["#294B38", "#A5B69A"],
          borderColor: "#F7F6EF",
          borderWidth: 4,
          hoverOffset: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#72796E",
            padding: 22,
            usePointStyle: true,
            pointStyle: "circle",
            font: { size: 12 },
          },
        },
      },
    },
  });

  let labels = [];
  let values = [];

  if (dashboardData.mode === "individual") {
    const mode = dashboardData.transportMode;

    labels = [
      typeof TRANSPORT_LABELS !== "undefined" && TRANSPORT_LABELS[mode]
        ? TRANSPORT_LABELS[mode]
        : mode || "Transport",
    ];
    values = [Number(dashboardData.transportEmissions || 0)];
  } else {
    const modes = [
      ["bus", "Bus"],
      ["petrolCar", "Petrol Car"],
      ["twoWheeler", "Two-wheeler"],
      ["metro", "Metro / Train"],
    ];

    modes.forEach(([key, label]) => {
      const emission = Number(dashboardData.transportBreakdown?.[key] || 0);

      if (emission > 0) {
        labels.push(label);
        values.push(emission);
      }
    });
  }

  transportChart = new Chart(transportCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Emissions (kg CO₂e)",
          data: values,
          backgroundColor: "#83977B",
          borderRadius: 4,
          maxBarThickness: 48,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#72796E" },
        },
        y: {
          beginAtZero: true,
          grid: { color: "#E3E5DC" },
          ticks: { color: "#72796E" },
        },
      },
    },
  });
}

// ========================================
// SENSOR DASHBOARD HTML
// ========================================

function getSensorDashboardMarkup() {
  return `
        <div class="sensor-divider"></div>

        <div class="sensor-heading">
            <div>
                <p class="dashboard-eyebrow">CAMPUS ENVIRONMENTAL MONITORING</p>
                <h3>Simulated Campus Energy Monitor</h3>
                <p class="sensor-description">
                    Track recorded electricity consumption and its estimated
                    carbon emissions.
                </p>
            </div>

            <div class="sensor-status">
                <span class="sensor-status-dot"></span>
                <span id="sensorConnectionStatus">Connecting...</span>
            </div>
        </div>

        <div class="sensor-toolbar">
            <div class="sensor-filter-group" aria-label="Select time range">
                <button type="button" class="sensor-filter active"
                    data-range="24h">24 Hours</button>
                <button type="button" class="sensor-filter"
                    data-range="7d">7 Days</button>
                <button type="button" class="sensor-filter"
                    data-range="30d">30 Days</button>
            </div>

            <div class="sensor-actions">
                <span id="sensorLastUpdated">Waiting for data...</span>
                <button type="button" id="refreshSensorButton"
                    class="sensor-refresh-button">Refresh</button>
                <button type="button" id="simulateSensorButton"
                    class="sensor-simulate-button">Generate sample readings</button>
            </div>
        </div>

        <div id="sensorMessage" class="sensor-message" aria-live="polite">
            Loading campus sensor readings...
        </div>

        <div class="sensor-summary-cards">
            <div class="sensor-summary-card">
                <span class="sensor-card-label">ELECTRICITY CONSUMPTION</span>
                <strong id="sensorTotalEnergy">—</strong>
                <span class="sensor-card-unit">kWh in selected period</span>
            </div>

            <div class="sensor-summary-card">
                <span class="sensor-card-label">ESTIMATED CARBON EMISSIONS</span>
                <strong id="sensorTotalCarbon">—</strong>
                <span class="sensor-card-unit">kg CO₂e in selected period</span>
            </div>

            <div class="sensor-summary-card">
                <span class="sensor-card-label">RECORDED READINGS</span>
                <strong id="sensorReadingCount">—</strong>
                <span class="sensor-card-unit">sensor records</span>
            </div>
        </div>

        <div class="sensor-chart-grid">
            <div class="sensor-chart-panel">
                <h4>Electricity Consumption Trend</h4>
                <div class="sensor-chart-container">
                    <canvas id="sensorConsumptionChart"></canvas>
                </div>
            </div>

            <div class="sensor-chart-panel">
                <h4>Carbon Emissions Trend</h4>
                <div class="sensor-chart-container">
                    <canvas id="sensorCarbonChart"></canvas>
                </div>
            </div>
        </div>

        <div class="sensor-records-panel">
            <div class="sensor-records-heading">
                <div>
                    <h4>Recent Simulated Readings</h4>
                    <p>Latest records received from the campus monitoring API</p>
                </div>
                <span id="sensorSourceLabel">Source: —</span>
            </div>

            <div class="sensor-table-wrapper">
                <table class="sensor-table">
                    <thead>
                        <tr>
                            <th>Sensor</th>
                            <th>Consumption</th>
                            <th>Carbon</th>
                            <th>Source</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody id="sensorReadingsBody">
                        <tr>
                            <td colspan="5">Loading readings...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <!-- 24-HOUR ML FORECAST -->
        <div class="sensor-divider"></div>

        <div class="sensor-heading">
            <div>
                <p class="dashboard-eyebrow">PREDICTIVE CAMPUS ANALYTICS</p>
                <h3>Next 24 Hours — Electricity Forecast</h3>
                <p class="sensor-description">
                    Estimated campus electricity consumption using historical
                    hourly readings and the forecasting model.
                </p>
            </div>
            <span class="sensor-source-tag source-simulated">
                ML Forecast
            </span>
        </div>

        <div id="forecastMessage" class="sensor-message" aria-live="polite">
            Loading electricity forecast...
        </div>

        <div class="sensor-summary-cards">
            <div class="sensor-summary-card">
                <span class="sensor-card-label">PREDICTED ELECTRICITY</span>
                <strong id="forecastTotalEnergy">—</strong>
                <span class="sensor-card-unit">kWh over next 24 hours</span>
            </div>

            <div class="sensor-summary-card">
                <span class="sensor-card-label">ESTIMATED CO₂ EMISSIONS</span>
                <strong id="forecastTotalCarbon">—</strong>
                <span class="sensor-card-unit">kg CO₂e over next 24 hours</span>
            </div>

            <div class="sensor-summary-card">
                <span class="sensor-card-label">AVERAGE HOURLY CONSUMPTION</span>
                <strong id="forecastAverageEnergy">—</strong>
                <span class="sensor-card-unit">kWh per hour</span>
            </div>
        </div>

        <div class="sensor-chart-grid">
            <div class="sensor-chart-panel">
                <h4>Predicted Electricity Consumption</h4>
                <div class="sensor-chart-container">
                    <canvas id="forecastConsumptionChart"></canvas>
                </div>
            </div>
        </div>

        <p class="sensor-disclaimer">
            Forecasts are model-generated estimates based on historical
            simulated campus readings. They are not actual future measurements.
        </p>
        <p class="sensor-disclaimer">
            Simulated readings are generated for demonstration and testing.
            They are not measurements from physical campus hardware.
        </p>
    `;
}

// ========================================
// GET SENSOR DATA FROM EXPRESS API
// ========================================

async function fetchSensorData() {
  if (sensorRequestInProgress) return;

  sensorRequestInProgress = true;

  const message = document.getElementById("sensorMessage");
  const status = document.getElementById("sensorConnectionStatus");

  try {
    const readingsResponse = await fetch(
      `${SENSOR_API}/${CAMPUS_ID}?limit=1000`,
    );

    if (!readingsResponse.ok) {
      throw new Error(`Readings API returned ${readingsResponse.status}`);
    }

    const readingsData = await readingsResponse.json();
    sensorReadings = extractReadings(readingsData);

    if (status) {
      status.textContent = "API connected";
    }

    updateSensorConnection(true);
    renderSensorDashboard();

    const lastUpdated = document.getElementById("sensorLastUpdated");

    if (lastUpdated) {
      lastUpdated.textContent = "Updated " + new Date().toLocaleTimeString();
    }

    if (message) {
      message.textContent = sensorReadings.length
        ? "Simulated campus readings loaded successfully."
        : "Connected successfully, but no simulated readings were found yet.";
      message.className = "sensor-message";
    }
  } catch (error) {
    console.error("Sensor dashboard error:", error);

    updateSensorConnection(false);

    if (status) {
      status.textContent = "Connection unavailable";
    }

    if (message) {
      message.textContent =
        "Unable to load sensor data. Check that the CarbonSense backend is running on port 5000.";
      message.className = "sensor-message sensor-message-error";
    }
  } finally {
    sensorRequestInProgress = false;
  }
}
// ========================================
// FETCH CAMPUS ELECTRICITY FORECAST
// ========================================

async function fetchCampusForecast() {
  if (forecastRequestInProgress) return;

  forecastRequestInProgress = true;

  const message = document.getElementById("forecastMessage");

  try {
    const response = await fetch(`${FORECAST_API}/${CAMPUS_ID}?hours=168`);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Unable to generate campus forecast.");
    }

    campusForecast = result;

    renderForecastDashboard();

    if (message) {
      message.textContent = `Forecast generated successfully using ${result.historicalReadingsUsed} historical hourly readings.`;
      message.className = "sensor-message sensor-message-success";
    }
  } catch (error) {
    console.error("Campus forecast error:", error);

    if (message) {
      message.textContent =
        "Unable to load the electricity forecast: " + error.message;
      message.className = "sensor-message sensor-message-error";
    }
  } finally {
    forecastRequestInProgress = false;
  }
}

// ========================================
// RENDER CAMPUS FORECAST
// ========================================

function renderForecastDashboard() {
  const forecast = campusForecast?.forecast;

  if (!Array.isArray(forecast) || forecast.length === 0) return;

  const totalEnergy = forecast.reduce(
    (sum, item) => sum + Number(item.predictedKwh || 0),
    0,
  );

  const totalCarbon = totalEnergy * ELECTRICITY_EMISSION_FACTOR;
  const averageEnergy = totalEnergy / forecast.length;

  setText("forecastTotalEnergy", totalEnergy.toFixed(2));
  setText("forecastTotalCarbon", totalCarbon.toFixed(2));
  setText("forecastAverageEnergy", averageEnergy.toFixed(2));

  const canvas = document.getElementById("forecastConsumptionChart");

  if (!canvas || typeof Chart === "undefined") return;

  if (forecastChart) {
    forecastChart.destroy();
    forecastChart = null;
  }

  const labels = forecast.map((item) =>
    new Date(item.timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const values = forecast.map((item) => Number(item.predictedKwh || 0));

  forecastChart = new Chart(canvas, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "Predicted electricity (kWh)",
          data: values,
          borderColor: "#526D51",
          backgroundColor: "rgba(131, 151, 123, 0.18)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointHoverRadius: 6,
        },
      ],
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index",
      },

      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },

        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.y.toFixed(2)} kWh`,
          },
        },
      },

      scales: {
        x: {
          grid: {
            display: false,
          },

          ticks: {
            color: "#72796E",
            maxTicksLimit: 8,
            maxRotation: 0,
          },
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: "Electricity (kWh)",
          },

          grid: {
            color: "#E3E5DC",
          },

          ticks: {
            color: "#72796E",
          },
        },
      },
    },
  });
}
// ========================================
// HANDLE DIFFERENT API RESPONSE SHAPES
// ========================================

function extractReadings(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response.readings)) return response.readings;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.records)) return response.records;

  return [];
}

// ========================================
// TIME FILTER
// ========================================

function getFilteredReadings() {
  const now = Date.now();

  const ranges = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const cutoff = now - ranges[selectedTimeRange];

  return sensorReadings.filter((reading) => {
    const timestamp = new Date(reading.timestamp).getTime();

    return Number.isFinite(timestamp) && timestamp >= cutoff;
  });
}

// ========================================
// RENDER SENSOR DASHBOARD
// ========================================

function renderSensorDashboard() {
  const dashboard = document.getElementById("sensorDashboard");

  // The user may not have calculated a footprint yet.
  // Create the sensor section without removing the existing empty state.
  if (!dashboard) {
    const content = document.getElementById("dashboardContent");
    if (!content) return;

    const sensorSection = document.createElement("div");
    sensorSection.className = "sensor-dashboard";
    sensorSection.id = "sensorDashboard";
    sensorSection.innerHTML = getSensorDashboardMarkup();
    content.appendChild(sensorSection);
  }

  const filtered = getFilteredReadings();

  const totalEnergy = filtered.reduce(
    (sum, item) => sum + Number(item.value || 0),
    0,
  );

  const totalCarbon = filtered.reduce(
    (sum, item) =>
      sum + Number(item.carbonKg ?? Number(item.value || 0) * 0.675),
    0,
  );

  setText("sensorTotalEnergy", totalEnergy.toFixed(2));
  setText("sensorTotalCarbon", totalCarbon.toFixed(2));
  setText("sensorReadingCount", filtered.length);

  const sources = [
    ...new Set(filtered.map((item) => item.source || "unknown")),
  ];

  setText(
    "sensorSourceLabel",
    sources.length
      ? "Source: " + sources.map(formatSource).join(", ")
      : "Source: —",
  );

  renderSensorCharts(filtered);
  renderSensorTable(filtered);
  renderForecastDashboard();
  updateFilterButtons();
}

// ========================================
// SMALL DOM HELPER
// ========================================

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

// ========================================
// SENSOR CHARTS
// ========================================

function renderSensorCharts(readings) {
  if (typeof Chart === "undefined") return;

  const consumptionCanvas = document.getElementById("sensorConsumptionChart");

  const carbonCanvas = document.getElementById("sensorCarbonChart");

  if (!consumptionCanvas || !carbonCanvas) return;

  if (sensorChart) {
    sensorChart.destroy();
    sensorChart = null;
  }

  if (carbonTrendChart) {
    carbonTrendChart.destroy();
    carbonTrendChart = null;
  }

  // Oldest reading first for chronological charts.
  const ordered = [...readings].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  const labels = ordered.map((item) =>
    new Date(item.timestamp).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  );

  const energyValues = ordered.map((item) => Number(item.value || 0));

  const carbonValues = ordered.map((item) =>
    Number(item.carbonKg ?? Number(item.value || 0) * 0.675),
  );

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index",
    },
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: "#72796E",
          maxTicksLimit: 7,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#E3E5DC" },
        ticks: { color: "#72796E" },
      },
    },
  };

  sensorChart = new Chart(consumptionCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Electricity (kWh)",
          data: energyValues,
          borderColor: "#526D51",
          backgroundColor: "rgba(131, 151, 123, 0.15)",
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: commonOptions,
  });

  carbonTrendChart = new Chart(carbonCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Carbon emissions (kg CO₂e)",
          data: carbonValues,
          borderColor: "#294B38",
          backgroundColor: "rgba(41, 75, 56, 0.10)",
          fill: true,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: commonOptions,
  });
}

// ========================================
// RECENT SENSOR READINGS TABLE
// ========================================

function renderSensorTable(readings) {
  const tbody = document.getElementById("sensorReadingsBody");
  if (!tbody) return;

  const latest = [...readings]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  if (!latest.length) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5">No readings available for this time range.</td>
            </tr>
        `;
    return;
  }

  tbody.innerHTML = latest
    .map((item) => {
      const carbon = Number(item.carbonKg ?? Number(item.value || 0) * 0.675);

      return `
            <tr>
                <td>${escapeHTML(item.sensorId || "Unknown")}</td>
                <td>${Number(item.value || 0).toFixed(2)} ${escapeHTML(item.unit || "kWh")}</td>
                <td>${carbon.toFixed(3)} kg</td>
                <td>
                    <span class="sensor-source-tag ${item.source === "simulated" ? "source-simulated" : "source-other"}">
                        ${escapeHTML(formatSource(item.source))}
                    </span>
                </td>
                <td>${new Date(item.timestamp).toLocaleString()}</td>
            </tr>
        `;
    })
    .join("");
}

// ========================================
// SAFE HTML TEXT
// ========================================

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function formatSource(source) {
  if (source === "simulated") return "Simulated";
  return "Other";
}

// ========================================
// CONNECTION STATUS
// ========================================

function updateSensorConnection(connected) {
  const status = document.querySelector(".sensor-status");

  if (!status) return;

  status.classList.toggle("sensor-offline", !connected);
}

// ========================================
// TIME FILTER BUTTONS
// ========================================

function updateFilterButtons() {
  document.querySelectorAll(".sensor-filter").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.range === selectedTimeRange,
    );
  });
}

// ========================================
// GENERATE SIMULATED SENSOR DATA
// ========================================

async function generateSensorReadings() {
  const button = document.getElementById("simulateSensorButton");
  const message = document.getElementById("sensorMessage");

  if (!button) return;

  button.disabled = true;
  button.textContent = "Generating...";

  try {
    const response = await fetch(`${SENSOR_API}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campusId: CAMPUS_ID,
        count: 20,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Simulation request failed.");
    }

    if (message) {
      message.textContent =
        "20 simulated readings generated and saved successfully.";
      message.className = "sensor-message sensor-message-success";
    }

    await fetchSensorData();
  } catch (error) {
    console.error("Sensor simulation error:", error);

    if (message) {
      message.textContent = "Could not generate readings: " + error.message;
      message.className = "sensor-message sensor-message-error";
    }
  } finally {
    button.disabled = false;
    button.textContent = "Generate sample readings";
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupSensorDashboardEvents() {
  const content = document.getElementById("dashboardContent");
  if (!content) return;

  content.addEventListener("click", (event) => {
    const filterButton = event.target.closest(".sensor-filter");

    if (filterButton) {
      selectedTimeRange = filterButton.dataset.range;
      renderSensorDashboard();
      return;
    }

    if (event.target.closest("#refreshSensorButton")) {
      fetchSensorData();
      fetchCampusForecast();
      return;
    }

    if (event.target.closest("#simulateSensorButton")) {
      generateSensorReadings();
    }
  });
}

// ========================================
// INITIALIZE SENSOR DASHBOARD
// ========================================

function initializeSensorDashboard() {
  const content = document.getElementById("dashboardContent");
  if (!content) return;

  // Add the monitoring interface while retaining the calculator empty state.
  if (!document.getElementById("sensorDashboard")) {
    const section = document.createElement("div");
    section.className = "sensor-dashboard";
    section.id = "sensorDashboard";
    section.innerHTML = getSensorDashboardMarkup();
    content.appendChild(section);
  }

  setupSensorDashboardEvents();

  fetchSensorData();
  fetchCampusForecast();

  if (sensorRefreshTimer) {
    clearInterval(sensorRefreshTimer);
  }

  sensorRefreshTimer = setInterval(() => {
    fetchSensorData();
    fetchCampusForecast();
  }, REFRESH_INTERVAL);
}

document.addEventListener("DOMContentLoaded", initializeSensorDashboard);
