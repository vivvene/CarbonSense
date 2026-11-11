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

  // Render individual calculator dashboard charts
  if (
    sectionId === "dashboardSection" &&
    typeof renderDashboardCharts === "function"
  ) {
    renderDashboardCharts();
  }

  // Refresh campus sensor dashboard when opened
  if (
    sectionId === "dashboardSection" &&
    typeof fetchSensorData === "function"
  ) {
    fetchSensorData();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
  if (
    sectionId === "simulatorSection" &&
    typeof renderSimulator === "function"
  ) {
    renderSimulator();
  }
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
