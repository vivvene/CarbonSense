console.log("CarbonSense Main JS Loaded");

// ========================================
// PAGE SECTIONS
// ========================================

const pageSections = [
  "homeSection",
  "formSection",
  "dashboardSection",
  "recommendationsSection",
  "simulatorSection",
];

// ========================================
// DISPLAY SELECTED SECTION
// ========================================

function showSection(sectionId) {
  pageSections.forEach((id) => {
    const section = document.getElementById(id);

    if (section) {
      section.hidden = id !== sectionId;
    }
  });

  if (sectionId === "dashboardSection") {
    requestAnimationFrame(() => {
      if (typeof renderDashboardCharts === "function") {
        renderDashboardCharts();
      }

      if (typeof renderSensorDashboard === "function") {
        renderSensorDashboard();
      }

      if (typeof fetchSensorData === "function") {
        fetchSensorData();
      }

      if (typeof fetchCampusForecast === "function") {
        fetchCampusForecast();
      }
    });
  }

  if (
    sectionId === "simulatorSection" &&
    typeof renderSimulator === "function"
  ) {
    renderSimulator();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ========================================
// NAVIGATION BUTTONS
// ========================================

const navigationButtons = document.querySelectorAll("nav button");

navigationButtons.forEach((button) => {
  button.addEventListener("click", function () {
    const targetSection = button.dataset.section;

    if (targetSection) {
      showSection(targetSection);
    }
  });
});

// ========================================
// GET STARTED BUTTON
// ========================================

const startButton = document.getElementById("startButton");

if (startButton) {
  startButton.addEventListener("click", function () {
    showSection("formSection");
  });
}

// ========================================
// INITIAL PAGE
// ========================================

showSection("homeSection");
