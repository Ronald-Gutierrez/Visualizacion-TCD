import pandas as pd

# Leer el archivo CSV
input_file = 'data/real-daily_aqi_output.csv'
output_file = 'data/aqi_general_for_mounth.csv'

df = pd.read_csv(input_file)

# Convertir la columna 'date' a tipo datetime para extraer year y month
df['date'] = pd.to_datetime(df['date'])
df['year'] = df['date'].dt.year
df['month'] = df['date'].dt.month

# Función para formatear año y mes como YYYY-MM
def format_year_month(row):
    return f"{row['year']}-{row['month']:02}"

# Aplicar la función para formatear año y mes
df['year_month'] = df.apply(format_year_month, axis=1)

# Calcular el AQI general para cada contaminante por ciudad y por mes
district_monthly_aqi = df.groupby(['stationId', 'year_month']).agg({
    'PM2_5': 'max',
    'PM10': 'max',
    'NO2': 'max',
    'CO': 'max',
    'O3': 'max',
    'SO2': 'max'
}).reset_index()

# Renombrar columnas para reflejar que son valores de AQI
district_monthly_aqi.columns = ['stationId', 'year_month', 'AQI_PM2_5', 'AQI_PM10', 'AQI_NO2', 'AQI_CO', 'AQI_O3', 'AQI_SO2']

# Guardar resultados en un archivo CSV
district_monthly_aqi.to_csv(output_file, index=False)

print(f"Archivo guardado correctamente en {output_file}.")
