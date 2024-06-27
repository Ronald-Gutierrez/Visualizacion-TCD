import pandas as pd

# Leer el archivo CSV
input_file = 'data/real-daily_aqi_output.csv'
output_file = 'data/aqi_general_for_day.csv'

df = pd.read_csv(input_file)

# Calcular el AQI general para cada día por ciudad
district_daily_aqi = df.groupby(['stationId', 'date']).agg({
    'PM2_5': 'max',
    'PM10': 'max',
    'NO2': 'max',
    'CO': 'max',
    'O3': 'max',
    'SO2': 'max'
}).reset_index()

# Calcular el AQI general como el máximo de los AQIs individuales de los contaminantes
district_daily_aqi['AQI_general'] = district_daily_aqi[['PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']].max(axis=1)

# Seleccionar solo las columnas necesarias
district_daily_aqi = district_daily_aqi[['stationId', 'date', 'AQI_general']]

# Guardar resultados en un archivo CSV
district_daily_aqi.to_csv(output_file, index=False)

print(f"Archivo guardado correctamente en {output_file}.")
