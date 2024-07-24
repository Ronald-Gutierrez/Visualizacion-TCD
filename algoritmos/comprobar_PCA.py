import pandas as pd

# Cargar el archivo CSV
data = pd.read_csv('data/data_pca_real.csv')

# Obtener los valores únicos en la columna 'stationId'
unique_station_idss = data['stationId'].unique()
unique_station_ids = data['stationId'].nunique()

print(f'Número de stationId únicos: {unique_station_ids}')

# Imprimir los valores únicos
print('stationId únicos:')
for station_id in unique_station_idss:
    print(station_id)
