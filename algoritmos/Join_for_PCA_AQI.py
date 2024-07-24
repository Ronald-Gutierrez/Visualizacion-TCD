import pandas as pd

# Leer el archivo de datos de calidad del aire
aq_data = pd.read_csv('data/beijing_17_18_aq.csv')

# Leer el archivo de coordenadas
coord_data = pd.read_csv('data/lat_lon_beijijng_aq.csv')

# Unir los dos DataFrames basados en 'stationId'
merged_data = pd.merge(aq_data, coord_data, on='stationId')

# Reordenar las columnas según el orden especificado
ordered_columns = ['stationId', 'longitude', 'latitude', 'utc_time', 'PM2.5', 'PM10', 'NO2', 'CO', 'O3', 'SO2', 'Notes']
final_data = merged_data[ordered_columns]

# Guardar el DataFrame combinado en un nuevo archivo CSV
final_data.to_csv('data/PCA_AQI.csv', index=False)

print("Los archivos se han unido y guardado en 'PCA_AQI.csv' con éxito.")
