import pandas as pd
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
import numpy as np

# Función para leer un archivo CSV con manejo de errores
def read_csv_with_error_handling(filepath):
    try:
        data = pd.read_csv(filepath, on_bad_lines='skip', encoding='utf-8')
        return data
    except pd.errors.ParserError as e:
        print(f"Error al leer el archivo {filepath}: {e}")
        return pd.DataFrame()  # Retorna un DataFrame vacío en caso de error

# Función para crear datos ficticios
def create_synthetic_data(dates, times, features):
    synthetic_data = []
    for date in dates:
        for time in times:
            # Crear una fila de datos ficticios
            row = {feature: np.random.uniform(0, 100) for feature in features}
            row.update({
                'date': date,
                'time': time,
                'stationId': 'synthetic_station'
            })
            synthetic_data.append(row)
    return pd.DataFrame(synthetic_data)

# Cargar los datos de los archivos CSV
aqi_data = read_csv_with_error_handling('data/PCA_AQI.csv')
meo_data = read_csv_with_error_handling('data/PCA_MEO.csv')
knn_data = read_csv_with_error_handling('data/knn_PCA.csv')

# Verificar si los datos se cargaron correctamente
if aqi_data.empty or meo_data.empty or knn_data.empty:
    print("Uno o más archivos no se cargaron correctamente.")
else:
    # Preparar los datos para t-SNE
    features = [
        'PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2',
        'temperature', 'pressure', 'humidity', 'wind_direction', 'wind_speed'
    ]

    # Iterar sobre cada par de estación AQI y MEO para aplicar t-SNE
    tsne_results = []
    
    for _, row in knn_data.iterrows():
        aqi_station = row['aqi_stationId']
        meo_station = row['nearest_meo_stationId']

        # Filtrar datos para la estación AQI y la estación MEO más cercana
        aqi_filtered = aqi_data[aqi_data['stationId'] == aqi_station]
        meo_filtered = meo_data[meo_data['stationId'] == meo_station]

        if aqi_filtered.empty or meo_filtered.empty:
            print(f"Datos faltantes para: AQI Station: {aqi_station}, MEO Station: {meo_station}")
            dates = aqi_data['date'].unique() if not aqi_data.empty else meo_data['date'].unique()
            times = aqi_data['time'].unique() if not aqi_data.empty else meo_data['time'].unique()
            
            # Crear datos ficticios
            combined_data = create_synthetic_data(dates, times, features)
        else:
            # Unir datos filtrados
            combined_data = pd.merge(aqi_filtered, meo_filtered, on=['date', 'time'], suffixes=('', '_y'))

        # Verificar si hay datos suficientes para t-SNE
        if not combined_data.empty:
            # Extraer las características numéricas
            X = combined_data[features]

            # Rellenar valores NaN con la media de cada columna
            imputer = SimpleImputer(strategy='mean')
            X_imputed = imputer.fit_transform(X)

            # Estandarizar los datos
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_imputed)

            # Aplicar t-SNE
            tsne = TSNE(n_components=2, random_state=0)  # Puedes ajustar random_state para reproducibilidad
            tsne_results_transformed = tsne.fit_transform(X_scaled)
            
            # Crear un DataFrame con los resultados de t-SNE
            tsne_df = pd.DataFrame(data=tsne_results_transformed, columns=['TSNE1', 'TSNE2'])
            tsne_df['stationId'] = aqi_station
            tsne_df['date'] = combined_data['date'].values
            tsne_df['time'] = combined_data['time'].values

            tsne_results.append(tsne_df)

    # Concatenar todos los resultados de t-SNE en un solo DataFrame
    if tsne_results:
        final_tsne_df = pd.concat(tsne_results, ignore_index=True)

        # Reordenar y guardar el archivo t-SNE
        final_tsne_df = final_tsne_df[['stationId', 'date', 'time', 'TSNE1', 'TSNE2']]
        final_tsne_df.to_csv('data/data_tsne_real.csv', index=False)

        print("Archivo t-SNE guardado como 'data/data_tsne_real.csv'")
    else:
        print("No se generaron resultados t-SNE.")

        
print("KL Divergence durante el entrenamiento:", tsne.kl_divergence_)
