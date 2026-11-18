import os
import pickle
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error


# --------------------------------------------------
# 1. Generate synthetic hourly electricity data
# --------------------------------------------------

def generate_synthetic_data(days=30):
    """
    Generate realistic-looking hourly electricity consumption
    for a college campus.

    This is synthetic data for ML model development and testing.
    """

    np.random.seed(42)

    timestamps = pd.date_range(
        start="2026-10-01 00:00:00",
        periods=days * 24,
        freq="h"
    )

    data = []

    for timestamp in timestamps:
        hour = timestamp.hour
        day_of_week = timestamp.dayofweek

        # Base consumption
        if 0 <= hour < 6:
            base = 35
        elif 6 <= hour < 9:
            base = 55
        elif 9 <= hour < 13:
            base = 90
        elif 13 <= hour < 17:
            base = 100
        elif 17 <= hour < 20:
            base = 75
        else:
            base = 50

        # Lower consumption on weekends
        if day_of_week >= 5:
            base *= 0.65

        # Small daily variation
        daily_variation = np.random.normal(0, 5)

        # Random noise
        noise = np.random.normal(0, 4)

        consumption = max(
            10,
            base + daily_variation + noise
        )

        data.append({
            "timestamp": timestamp,
            "consumption_kwh": round(consumption, 2)
        })

    return pd.DataFrame(data)


# --------------------------------------------------
# 2. Create time-based features
# --------------------------------------------------

def create_features(df):
    """
    Create features that the ML model can use
    to predict electricity consumption.
    """

    df = df.copy()

    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek

    # Previous hour's consumption
    df["lag_1"] = df["consumption_kwh"].shift(1)

    # Consumption 24 hours ago
    df["lag_24"] = df["consumption_kwh"].shift(24)

    # Average consumption over the previous 24 hours
    df["rolling_24"] = (
        df["consumption_kwh"]
        .shift(1)
        .rolling(window=24)
        .mean()
    )

    # Remove rows where lag/rolling values are unavailable
    df = df.dropna().reset_index(drop=True)

    return df


# --------------------------------------------------
# 3. Train the model
# --------------------------------------------------

def train_model():

    print("Generating synthetic electricity dataset...")

    df = generate_synthetic_data(days=30)

    # Create data directory
    os.makedirs("data", exist_ok=True)

    # Save dataset
    dataset_path = "data/synthetic_electricity.csv"
    df.to_csv(dataset_path, index=False)

    print(f"Dataset saved to: {dataset_path}")
    print(f"Total observations: {len(df)}")

    # Create features
    df_features = create_features(df)

    feature_columns = [
        "hour",
        "day_of_week",
        "lag_1",
        "lag_24",
        "rolling_24"
    ]

    X = df_features[feature_columns]
    y = df_features["consumption_kwh"]

    # --------------------------------------------------
    # Chronological train-test split
    # --------------------------------------------------

    split_index = int(len(df_features) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    print(f"Training observations: {len(X_train)}")
    print(f"Testing observations: {len(X_test)}")

    # --------------------------------------------------
    # Train Random Forest model
    # --------------------------------------------------

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        random_state=42
    )

    print("\nTraining Random Forest model...")

    model.fit(X_train, y_train)

    # --------------------------------------------------
    # Evaluate model
    # --------------------------------------------------

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))

    print("\n----- Model Evaluation -----")
    print(f"MAE  : {mae:.2f} kWh")
    print(f"RMSE : {rmse:.2f} kWh")

    # --------------------------------------------------
    # Save trained model
    # --------------------------------------------------

    os.makedirs("models", exist_ok=True)

    model_data = {
        "model": model,
        "features": feature_columns
    }

    model_path = "models/forecast_model.pkl"

    with open(model_path, "wb") as file:
        pickle.dump(model_data, file)

    print(f"\nModel saved to: {model_path}")
    print("\nTraining completed successfully!")


# --------------------------------------------------
# Run training
# --------------------------------------------------

if __name__ == "__main__":
    train_model()