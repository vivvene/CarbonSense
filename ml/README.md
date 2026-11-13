# CarbonSense ML Module

This module provides electricity consumption forecasting for the
CarbonSense project.

## Overview

The ML module uses a Random Forest Regression model to forecast
electricity consumption for the next 24 hours.

The current training dataset is synthetic and is generated using
assumed college campus operating-hour patterns. It is intended for
prototype development and testing.

## Project Structure

```text
ml/
├── data/
│   └── synthetic_electricity.csv
├── models/
│   └── forecast_model.pkl
├── train.py
├── predict.py
├── main.py
├── test_api.py
├── requirements.txt
└── README.md