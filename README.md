# 🌿 CarbonSense — Measure Less. Understand More. Act Smarter.

### 🌍 Carbon Footprint Calculator & Sustainability Insights Platform

**CarbonSense** is an Environmental Studies project that helps individuals and campus communities understand their carbon footprint through emission calculations, interactive dashboards, personalized recommendations, and a what-if reduction simulator.

<p align="center">
  <img src="https://img.shields.io/badge/Project-Environmental%20Sustainability-2E7D32?style=for-the-badge" alt="Environmental Sustainability" />
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JS-43A047?style=for-the-badge" alt="Frontend" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-388E3C?style=for-the-badge" alt="Backend" />
  <img src="https://img.shields.io/badge/Status-Academic%20Prototype-66BB6A?style=for-the-badge" alt="Academic Prototype" />
</p>

---

## 🍃 Why CarbonSense?

Understanding your carbon footprint is the first step towards reducing it.

CarbonSense transforms everyday electricity and transportation data into understandable emission estimates, helping users identify major contributors and explore practical ways to reduce their impact.

**Our mission:** Make carbon awareness measurable, understandable, and actionable.

## ✨ Key Features

| Feature                        | Description                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 🧍 **Individual Calculator**   | Estimate emissions from electricity consumption and transportation.                                     |
| 🏫 **Campus Calculator**       | Estimate campus emissions using electricity use, commuter counts, travel distances, and operating days. |
| 📊 **Emission Dashboard**      | Visualize total emissions and electricity versus transportation contributions.                          |
| 🌱 **Smart Recommendations**   | Identify significant emission sources and display reduction suggestions.                                |
| 🔄 **What-If Simulator**       | Explore how hypothetical reductions could change total emissions.                                       |
| ⚙️ **Backend Calculation API** | Centralize emission calculations, validate inputs, and return structured results.                       |

## 🖥️ How It Works

```text
       🌍 USER INPUT
             |
             v
  Electricity + Transportation
             |
             v
    ⚙️ CarbonSense API
       Node.js + Express
             |
             v
    🌱 Emission Calculator
             |
             v
  ┌──────────┼───────────┐
  v          v           v
📊 Dashboard 🌿 Insights 🔄 Simulator
```

The frontend collects activity data and sends it to the backend. The backend applies configured emission factors and returns the calculation breakdown. The frontend then presents the results through the dashboard, recommendations, and simulator.

## 🛠️ Technology Stack

<p>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js" />
</p>

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js and Express.js
- **API:** REST endpoints with JSON request and response bodies
- **Development:** Visual Studio Code, Git, and GitHub

## 🏗️ Project Structure

```text
CarbonSense/
├── backend/
│   ├── controllers/
│   │   └── carbonController.js
│   ├── data/
│   │   └── emissionFactors.js
│   ├── routes/
│   │   └── carbonRoutes.js
│   ├── utils/
│   │   └── carbonCalculator.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── index.html
│   └── js/
│       ├── calculator.js
│       ├── dashboard.js
│       ├── main.js
│       ├── recommendations.js
│       ├── simulator.js
│       ├── validation.js
│       └── script.js
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A modern web browser
- Visual Studio Code (recommended)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/vivvene/CarbonSense.git
cd CarbonSense
```

### 2️⃣ Install backend dependencies

```bash
cd backend
npm install
```

### 3️⃣ Start the backend

```bash
npm run dev
```

If the development script is not configured, use `npm start` instead.

The backend runs on:

`http://localhost:5000`

### 4️⃣ Launch the frontend

Open `frontend/index.html` using the VS Code Live Server extension.

Keep the backend running while using the calculator. The frontend communicates with the local backend API.

## 🔌 Backend API

### `POST /api/carbon/calculate`

Calculates electricity and transportation emissions.

**Example request:**

```json
{
  "electricityKwh": 100,
  "transport": [
    {
      "mode": "bus",
      "distanceKm": 220
    }
  ]
}
```

**Example response:**

```json
{
  "success": true,
  "emissionBreakdown": {
    "electricityEmissions": 67.5,
    "transportEmissions": 3.33542,
    "totalEmissions": 70.83542
  },
  "unit": "kg CO2"
}
```

The response above illustrates the principal calculation fields; the actual API also returns input data and a transportation breakdown.

Additional endpoints:

- `GET /api/health` — basic server health check
- `GET /api/project` — project information
- `GET /api/test` — basic API test endpoint

## 🌎 Emission Factors & Sustainability Data

CarbonSense uses configured operational emission factors to estimate the carbon impact of selected activities.

| Activity       |   Factor | Unit                         |
| -------------- | -------: | ---------------------------- |
| ⚡ Electricity |    0.675 | kg CO₂/kWh                   |
| 🚌 Bus         | 0.015161 | kg CO₂/passenger-km          |
| 🚗 Petrol car  |    0.127 | kg CO₂/km                    |
| 🛵 Two-wheeler |   0.0319 | kg CO₂/km                    |
| 🚶 Walking     |        0 | kg direct operational CO₂/km |
| 🚲 Cycling     |        0 | kg direct operational CO₂/km |

**Data references:** Central Electricity Authority (CEA), grid-emission-factor reference for FY 2025–26, version 22; India GHG Program, 2015 road-transport reference factors.

These factors depend on their source assumptions and applicable vehicle categories. They are intended for prototype-level estimates, not a complete life-cycle assessment.

> ⚠️ **Current limitation:** Verified factors are not yet configured for diesel cars, auto-rickshaws, and metro travel. The backend rejects positive-distance calculations for these modes rather than inventing emission values.

## 🧪 Validation & Reliability

The backend includes input validation for electricity consumption, transportation distances, and supported transport modes. Unavailable factors are rejected instead of silently producing misleading results.

## 🌱 What Makes CarbonSense Different?

- **Two use cases, one calculation system:** individual and campus-level estimation.
- **Beyond numbers:** visual breakdowns and recommendations help explain the results.
- **Action-oriented exploration:** the simulator lets users investigate potential reductions.
- **Transparent assumptions:** configured emission factors and known limitations are documented.

## 👥 Our Team

Developed as an Environmental Studies project at **Techno India University**.

| Team member       | Responsibility                        |
| ----------------- | ------------------------------------- |
| **Shreya Halder** | Backend development & API integration |
| **Suhana**        | Frontend development                  |
| **Ayusi**         | Carbon data & sustainability research |
| **Disha**         | Recommendations & quality assurance   |

## 🔮 Future Scope

- Expand verified emission-factor coverage.
- Improve error messages and transport-mode validation.
- Add data persistence and historical comparisons.
- Explore campus-wide reporting and richer sustainability insights.
- Deploy the prototype for broader demonstration.

## 📌 Project Status

CarbonSense is an academic prototype with a connected frontend and backend calculation API. Its current scope focuses on carbon estimation, visualization, recommendations, and reduction simulation.

---

<p align="center">
  <strong>🌿 CarbonSense</strong><br/>
  <em>Measure less. Understand more. Act smarter.</em>
</p>
