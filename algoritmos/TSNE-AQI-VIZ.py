import pandas as pd

# Leer los archivos CSV
pca_df = pd.read_csv('data/data_tsne_real.csv')
aqi_df = pd.read_csv('data/hour_aqi_output.csv')

# Unir los archivos según 'stationId', 'date', y 'time'
merged_df = pd.merge(pca_df, aqi_df, on=['stationId', 'date', 'time'])

# Calcular AQI como el valor máximo entre 'PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2'
merged_df['AQI'] = merged_df[['PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']].max(axis=1)

# Seleccionar las columnas finales y guardar el archivo CSV
result_df = merged_df[['stationId', 'date', 'time', 'PC1', 'PC2', 'AQI']]
result_df.to_csv('TSNE_VIZ_AQI.csv', index=False)
