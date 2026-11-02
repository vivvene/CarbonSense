console.log("Dashboard JS Loaded");

// ========================================
// DASHBOARD VARIABLES
// ========================================

let dashboardData = null;
let sourceChart = null;
let transportChart = null;


// ========================================
// UPDATE DASHBOARD
// ========================================

function updateDashboard(data) {

    dashboardData = data;

    const content = document.getElementById("dashboardContent");

    if (!content) return;

    content.innerHTML = `
        <div class="dashboard-cards">

            <div class="dashboard-card">
                <h3>Total Monthly Emissions</h3>
                <p>${data.total.toFixed(2)}</p>
                <span>kg CO₂e</span>
            </div>

            <div class="dashboard-card">
                <h3>Electricity Contribution</h3>
                <p>${data.electricityShare.toFixed(1)}%</p>
            </div>

            <div class="dashboard-card">
                <h3>Transport Contribution</h3>
                <p>${data.transportShare.toFixed(1)}%</p>
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
    `;


    // ========================================
    // PERSONALIZED INSIGHT
    // ========================================

    const highest =
        data.electricityEmissions >= data.transportEmissions
            ? "Electricity"
            : "Transportation";

    document.getElementById("dashboardInsight").textContent =
        "Your highest emission source is " + highest + ".";


    // Render charts
    renderDashboardCharts();
}


// ========================================
// RENDER DASHBOARD CHARTS
// ========================================

function renderDashboardCharts() {

    if (!dashboardData || typeof Chart === "undefined") {
        return;
    }

    const sourceCanvas = document.getElementById("sourceChart");
    const transportCanvas = document.getElementById("transportChart");

    if (!sourceCanvas || !transportCanvas) {
        return;
    }


    // Destroy previous chart instances

    if (sourceChart) {
        sourceChart.destroy();
        sourceChart = null;
    }

    if (transportChart) {
        transportChart.destroy();
        transportChart = null;
    }


    // ========================================
    // CHART 1: EMISSIONS BY SOURCE
    // ========================================

    sourceChart = new Chart(sourceCanvas, {

        type: "doughnut",

        data: {

            labels: [
                "Electricity",
                "Transportation"
            ],

            datasets: [{

                data: [
                    dashboardData.electricityEmissions,
                    dashboardData.transportEmissions
                ],

                backgroundColor: [
                    "#294B38",
                    "#A5B69A"
                ],

                borderColor: "#F7F6EF",
                borderWidth: 4,
                hoverOffset: 7

            }]

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

                        font: {
                            size: 12
                        }

                    }

                }

            }

        }

    });


    // ========================================
    // CHART 2: TRANSPORT BREAKDOWN
    // ========================================

    let labels = [];
    let values = [];


    if (dashboardData.mode === "individual") {

        const mode = dashboardData.transportMode;

        labels = [
            TRANSPORT_LABELS[mode] || mode
        ];

        values = [
            dashboardData.transportEmissions
        ];

    } else {

        const modes = [
            ["bus", "Bus"],
            ["petrolCar", "Petrol Car"],
            ["twoWheeler", "Two-wheeler"],
            ["metro", "Metro / Train"]
        ];

        modes.forEach(([key, label]) => {

            const emission =
                dashboardData.transportBreakdown[key] || 0;

            // Hide modes with zero emissions
            if (emission > 0) {

                labels.push(label);
                values.push(emission);

            }

        });

    }


    // ========================================
    // CREATE TRANSPORT BAR CHART
    // ========================================

    transportChart = new Chart(transportCanvas, {

        type: "bar",

        data: {

            labels: labels,

            datasets: [{

                label: "Emissions (kg CO₂e)",

                data: values,

                backgroundColor: "#83977B",

                borderRadius: 4,

                maxBarThickness: 48

            }]

        },

        options: {

            responsive: true,
            maintainAspectRatio: false,

            plugins: {

                legend: {
                    display: false
                }

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    ticks: {
                        color: "#72796E"
                    }

                },

                y: {

                    beginAtZero: true,

                    grid: {
                        color: "#E3E5DC"
                    },

                    ticks: {
                        color: "#72796E"
                    }

                }

            }

        }

    });

}