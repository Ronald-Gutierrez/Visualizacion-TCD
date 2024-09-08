import pandas as pd
from sklearn.decomposition import PCA
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
def create_synthetic_data(dates, features):
    synthetic_data = []
    for date in dates:
        # Crear una fila de datos ficticios
        row = {feature: np.random.uniform(0, 100) for feature in features}
        row.update({
            'date': date,
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
    # Preparar los datos para PCA
    features = [
        'PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2',
        'temperature', 'pressure', 'humidity'
    ]

    # Iterar sobre cada par de estación AQI y MEO para aplicar PCA
    pca_results = []
    
    for _, row in knn_data.iterrows():
        aqi_station = row['aqi_stationId']
        meo_station = row['nearest_meo_stationId']

        # Filtrar datos para la estación AQI y la estación MEO más cercana
        aqi_filtered = aqi_data[aqi_data['stationId'] == aqi_station]
        meo_filtered = meo_data[meo_data['stationId'] == meo_station]

        if aqi_filtered.empty or meo_filtered.empty:
            print(f"Datos faltantes para: AQI Station: {aqi_station}, MEO Station: {meo_station}")
            dates = aqi_data['date'].unique() if not aqi_data.empty else meo_data['date'].unique()
            
            # Crear datos ficticios
            combined_data = create_synthetic_data(dates, features)
        else:
            # Unir datos filtrados
            combined_data = pd.merge(aqi_filtered, meo_filtered, on=['date', 'time'], suffixes=('', '_y'))

        # Seleccionar solo las columnas numéricas para calcular la media
        numeric_columns = combined_data.select_dtypes(include=[np.number])

        # Agrupar por fecha y calcular la media diaria solo en columnas numéricas
        combined_data_numeric = combined_data.groupby('date')[numeric_columns.columns].mean().reset_index()

        # Verificar si hay datos suficientes para PCA
        if not combined_data_numeric.empty:
            # Extraer las características numéricas
            X = combined_data_numeric[features]

            # Rellenar valores NaN con la media de cada columna
            imputer = SimpleImputer(strategy='mean')
            X_imputed = imputer.fit_transform(X)

            # Estandarizar los datos
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X_imputed)

            # Aplicar PCA
            pca = PCA(n_components=2)
            principal_components = pca.fit_transform(X_scaled)

            # Imprimir varianza explicada
            print("Varianza explicada por cada componente principal:", pca.explained_variance_ratio_)
            print("Varianza explicada acumulada:", pca.explained_variance_ratio_.sum())

            # Crear un DataFrame con los componentes principales
            pca_df = pd.DataFrame(data=principal_components, columns=['PC1', 'PC2'])
            pca_df['stationId'] = aqi_station
            pca_df['date'] = combined_data_numeric['date'].values

            pca_results.append(pca_df)

    # Concatenar todos los resultados de PCA en un solo DataFrame
    if pca_results:
        final_pca_df = pd.concat(pca_results, ignore_index=True)

        # Reordenar y guardar el archivo PCA
        final_pca_df = final_pca_df[['stationId', 'date', 'PC1', 'PC2']]
        final_pca_df.to_csv('data/data_pca_real_SIN-DW_for_day.csv', index=False)

        print("Archivo PCA guardado como 'data/data_pca_real_SIN-DW_for_day.csv'")
    else:
        print("No se generaron resultados PCA.")
