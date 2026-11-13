import os
import pickle
import pandas as pd


# --------------------------------------------------
# 1. Load the trained model
# --------------------------------------------------

def load_model():

    model_path = os.path.join(
        os.path.dirname(__file__),
        "models",
        "forecast_model.pkl"
    )

    with open(model_path, "rb") as file:
        model_data = pickle.load(file)

    return model_data["model"]


# --------------------------------------------------
# 2. Generate next 24-hour forecast
# --------------------------------------------------

def predict_next_24_hours(history):

    model = load_model()

    history = history.copy()

    history["timestamp"] = pd.to_datetime(
        history["timestamp"]
    )

    history = history.sort_values("timestamp")

    if len(history) < 24:
        raise ValueError(
            "At least 24 hourly observations are required."
        )

    if history["consumption_kwh"].isna().any():
        raise ValueError("Historical consumption contains missing values.")

    if not history["timestamp"].is_monotonic_increasing:
        raise ValueError("Timestamps must be chronological.")

    # Ensure the input contains consecutive hourly observations
    if not history["timestamp"].diff().dropna().eq(
        pd.Timedelta(hours=1)
    ).all():
        raise ValueError(
            "Historical observations must be exactly one hour apart."
        )

    predictions = []

    # Keep historical consumption values
    consumption_values = history[
        "consumption_kwh"
    ].astype(float).tolist()

    last_timestamp = history["timestamp"].iloc[-1]

    # Predict one hour at a time
    for i in range(24):

        next_timestamp = last_timestamp + pd.Timedelta(hours=i + 1)

        hour = next_timestamp.hour
        day_of_week = next_timestamp.dayofweek

        lag_1 = consumption_values[-1]
        lag_24 = consumption_values[-24]

        rolling_24 = sum(
            consumption_values[-24:]
        ) / 24

        input_data = pd.DataFrame([{
            "hour": hour,
            "day_of_week": day_of_week,
            "lag_1": lag_1,
            "lag_24": lag_24,
            "rolling_24": rolling_24
        }])

        predicted_value = float(
            model.predict(input_data)[0]
        )

        predicted_value = max(0, predicted_value)

        predictions.append({
            "timestamp": next_timestamp.isoformat(),
            "predictedKwh": round(predicted_value, 2)
        })

        # Add prediction to history for the next iteration
        consumption_values.append(predicted_value)

    return predictions


# --------------------------------------------------
# 3. Test prediction independently
# --------------------------------------------------

if __name__ == "__main__":

    dataset_path = os.path.join(
        os.path.dirname(__file__),
        "data",
        "synthetic_electricity.csv"
    )

    history = pd.read_csv(dataset_path)

    # Use the first 29 days as historical data
    history = history.iloc[:29 * 24]

    forecast = predict_next_24_hours(history)

    print("\n----- NEXT 24 HOURS FORECAST -----")

    for item in forecast:
        print(
            item["timestamp"],
            " | ",
            item["predictedKwh"],
            "kWh"
        )

    print("\nTotal predictions:", len(forecast))