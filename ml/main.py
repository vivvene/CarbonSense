from datetime import datetime
from typing import List

import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from predict import predict_next_24_hours


# --------------------------------------------------
# 1. Create FastAPI application
# --------------------------------------------------

app = FastAPI(
    title="CarbonSense ML API",
    description="Electricity consumption forecasting service",
    version="1.0"
)


# --------------------------------------------------
# 2. Define input data structure
# --------------------------------------------------

class Reading(BaseModel):
    timestamp: datetime
    consumption_kwh: float = Field(ge=0)


class ForecastRequest(BaseModel):
    history: List[Reading]


# --------------------------------------------------
# 3. Health check endpoint
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "CarbonSense ML API is running!",
        "status": "active"
    }


# --------------------------------------------------
# 4. Electricity forecasting endpoint
# --------------------------------------------------

@app.post("/forecast")
def forecast_electricity(request: ForecastRequest):

    try:

        # Convert incoming readings into a DataFrame
        history = pd.DataFrame([
            {
                "timestamp": reading.timestamp,
                "consumption_kwh": reading.consumption_kwh
            }
            for reading in request.history
        ])

        # Check minimum historical data
        if len(history) < 24:
            raise HTTPException(
                status_code=400,
                detail="At least 24 hourly readings are required."
            )

        # Ensure readings are in chronological order
        if not history["timestamp"].is_monotonic_increasing:
            raise HTTPException(
                status_code=400,
                detail="Readings must be provided in chronological order."
            )

        # Generate next 24-hour forecast
        predictions = predict_next_24_hours(history)

        return {
            "status": "success",
            "forecast_hours": len(predictions),
            "forecast": predictions
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


# --------------------------------------------------
# Run using Uvicorn
# --------------------------------------------------