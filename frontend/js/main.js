console.log("CarbonSense Main JS Loaded");

// ========================================
// PAGE SECTIONS
// ========================================

const pageSections = [
    "homeSection",
    "formSection",
    "dashboardSection",
    "recommendationsSection",
    "simulatorSection"
];


// ========================================
// DISPLAY SELECTED SECTION
// ========================================

function showSection(sectionId) {

    pageSections.forEach(id => {

        const section = document.getElementById(id);

        if (section) {
            section.hidden = id !== sectionId;
        }

    });

    // Render dashboard charts when dashboard is opened.
    if (
        sectionId === "dashboardSection" &&
        typeof renderDashboardCharts === "function"
    ) {
        renderDashboardCharts();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ========================================
// NAVIGATION BUTTONS
// ========================================

const navigationButtons =
    document.querySelectorAll("nav button");

navigationButtons.forEach(button => {

    button.addEventListener("click", function() {

        const targetSection = button.dataset.section;

        showSection(targetSection);

    });

});


// ========================================
// GET STARTED BUTTON
// ========================================

const startButton =
    document.getElementById("startButton");

if (startButton) {

    startButton.addEventListener("click", function() {

        showSection("formSection");

    });

}


// ========================================
// INITIAL PAGE
// ========================================

showSection("homeSection");