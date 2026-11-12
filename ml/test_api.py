import pandas as pd
import requests
import os

# Load the synthetic dataset
dataset_path = os.path.join(
    os.path.dirname(__file__),
    "data",
    "synthetic_electricity.csv"
)

df = pd.read_csv(dataset_path)

# Use 29 days of historical readings
history = df.iloc[:29 * 24].copy()

# Prepare API request
payload = {
    "history": history.to_dict(orient="records")
}

# Send request to FastAPI
response = requests.post(
    "http://127.0.0.1:8000/forecast",
    json=payload
)

print("Status code:", response.status_code)

print("\nForecast response:")
print(response.json())

if response.status_code == 200:
    print("\nAPI forecasting test successful!")
    print("Total predictions:",
          response.json()["forecast_hours"])