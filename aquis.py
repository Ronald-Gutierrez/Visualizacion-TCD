import pandas as pd

# Define the function to calculate IAQI
def calculate_IAQI(Cp, BPLo, BPHi, IAQILo, IAQIHi):
    IAQIp = ((IAQIHi - IAQILo) / (BPHi - BPLo)) * (Cp - BPLo) + IAQILo
    return IAQIp

# Example data for pollutants
data = {
    'City': ['CityA', 'CityB'],
    'Latitude': [34.0522, 31.2304],
    'Longitude': [-118.2437, 121.4737],
    'PM2.5': [35, 75],
    'PM10': [50, 120],
    'SO2': [8, 20],
    'NO2': [14, 50],
    'CO': [0.5, 1.2],
    'O3': [70, 150]
}

# Define national standard limits and corresponding IAQI limits according to HJ633-2012
pollutant_limits = {
    'PM2.5': [
        {'BPLo': 0, 'BPHi': 35, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 35, 'BPHi': 75, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 75, 'BPHi': 115, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 115, 'BPHi': 150, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 150, 'BPHi': 250, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 250, 'BPHi': 350, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 350, 'BPHi': 500, 'IAQILo': 400, 'IAQIHi': 500}
    ],
    'PM10': [
        {'BPLo': 0, 'BPHi': 50, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 50, 'BPHi': 150, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 150, 'BPHi': 250, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 250, 'BPHi': 350, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 350, 'BPHi': 420, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 420, 'BPHi': 500, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 500, 'BPHi': 600, 'IAQILo': 400, 'IAQIHi': 500}
    ],
    'SO2': [
        {'BPLo': 0, 'BPHi': 150, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 150, 'BPHi': 500, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 500, 'BPHi': 650, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 650, 'BPHi': 800, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 800, 'BPHi': 1600, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 1600, 'BPHi': 2100, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 2100, 'BPHi': 2620, 'IAQILo': 400, 'IAQIHi': 500}
    ],
    'NO2': [
        {'BPLo': 0, 'BPHi': 100, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 100, 'BPHi': 200, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 200, 'BPHi': 700, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 700, 'BPHi': 1200, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 1200, 'BPHi': 2340, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 2340, 'BPHi': 3090, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 3090, 'BPHi': 3840, 'IAQILo': 400, 'IAQIHi': 500}
    ],
    'CO': [
        {'BPLo': 0, 'BPHi': 5, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 5, 'BPHi': 10, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 10, 'BPHi': 35, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 35, 'BPHi': 60, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 60, 'BPHi': 90, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 90, 'BPHi': 120, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 120, 'BPHi': 150, 'IAQILo': 400, 'IAQIHi': 500}
    ],
    'O3': [
        {'BPLo': 0, 'BPHi': 160, 'IAQILo': 0, 'IAQIHi': 50},
        {'BPLo': 160, 'BPHi': 200, 'IAQILo': 50, 'IAQIHi': 100},
        {'BPLo': 200, 'BPHi': 300, 'IAQILo': 100, 'IAQIHi': 150},
        {'BPLo': 300, 'BPHi': 400, 'IAQILo': 150, 'IAQIHi': 200},
        {'BPLo': 400, 'BPHi': 800, 'IAQILo': 200, 'IAQIHi': 300},
        {'BPLo': 800, 'BPHi': 1000, 'IAQILo': 300, 'IAQIHi': 400},
        {'BPLo': 1000, 'BPHi': 1200, 'IAQILo': 400, 'IAQIHi': 500}
    ]
}

# Convert data to DataFrame
df = pd.DataFrame(data)

# Function to calculate IAQI for given pollutant and value
def calculate_pollutant_IAQI(pollutant, Cp):
    limits = pollutant_limits[pollutant]
    for limit in limits:
        if limit['BPLo'] <= Cp <= limit['BPHi']:
            return calculate_IAQI(Cp, limit['BPLo'], limit['BPHi'], limit['IAQILo'], limit['IAQIHi'])
    return None

# Calculate IAQI for each pollutant
for pollutant in pollutant_limits:
    df[f'IAQI_{pollutant}'] = df[pollutant].apply(lambda x: calculate_pollutant_IAQI(pollutant, x))

# Calculate the overall AQI (highest IAQI value)
df['AQI'] = df[[f'IAQI_{pollutant}' for pollutant in pollutant_limits]].max(axis=1)

# Print the resulting DataFrame
print(df)
