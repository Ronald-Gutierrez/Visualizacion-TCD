import pandas as pd

# Leer el archivo CSV
input_file = 'data/real-daily_aqi_output.csv'
output_file = 'data/aqi_general_for_day.csv'

df = pd.read_csv(input_file)

# Calcular el AQI general para cada contaminante por ciudad y por día
district_daily_aqi = df.groupby(['stationId', 'date']).agg({
    'PM2_5': 'max',
    'PM10': 'max',
    'NO2': 'max',
    'CO': 'max',
    'O3': 'max',
    'SO2': 'max'
}).reset_index()

# Renombrar columnas para reflejar que son valores de AQI
district_daily_aqi.columns = ['stationId', 'date', 'AQI_PM2_5', 'AQI_PM10', 'AQI_NO2', 'AQI_CO', 'AQI_O3', 'AQI_SO2']

# Guardar resultados en un archivo CSV
district_daily_aqi.to_csv(output_file, index=False)

print(f"Archivo guardado correctamente en {output_file}.")
