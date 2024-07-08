import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import numpy as np
import matplotlib.pyplot as plt

# Supongamos que tienes dos dataframes, uno para contaminación y otro para datos meteorológicos
contaminacion_df = pd.DataFrame({
    'PM2_5': [12, 15, 13],
    'PM10': [30, 45, 35],
    'NO2': [20, 22, 19],
    'CO': [0.5, 0.4, 0.6],
    'O3': [50, 55, 53],
    'SO2': [8, 9, 7],
    'date': ['2024-07-01', '2024-07-02', '2024-07-03'],
    'time': ['12:00', '12:00', '12:00'],
})

meteorologia_df = pd.DataFrame({
    'temperature': [25, 26, 24],
    'pressure': [1012, 1013, 1011],
    'humidity': [60, 65, 55],
    'wind_direction': [180, 175, 190],
    'wind_speed': [3.5, 4.0, 3.2],
    'date': ['2024-07-01', '2024-07-02', '2024-07-03'],
    'time': ['12:00', '12:00', '12:00'],
})

# Fusionamos los dos dataframes en base a las columnas 'date' y 'time'
df_combinado = pd.merge(contaminacion_df, meteorologia_df, on=['date', 'time'])

# Normalización
scaler = StandardScaler()
caracteristicas = df_combinado[['PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2', 'temperature', 'pressure', 'humidity', 'wind_direction', 'wind_speed']]
caracteristicas_normalizadas = scaler.fit_transform(caracteristicas)

# Aplicación de PCA
pca = PCA(n_components=2)  # Cambia n_components al número deseado de componentes principales
componentes_principales = pca.fit_transform(caracteristicas_normalizadas)

# Crear un DataFrame con los componentes principales
df_componentes_principales = pd.DataFrame(data=componentes_principales, columns=['PC1', 'PC2'])
df_componentes_principales['date'] = df_combinado['date']
df_componentes_principales['time'] = df_combinado['time']

# Varianza explicada por cada componente principal
print("Varianza explicada por cada componente principal:", pca.explained_variance_ratio_)
print("Varianza explicada acumulada:", np.cumsum(pca.explained_variance_ratio_))

# Graficar los componentes principales por fecha
plt.figure(figsize=(10, 6))
scatter = plt.scatter(df_componentes_principales['PC1'], df_componentes_principales['PC2'], c=pd.to_datetime(df_componentes_principales['date']).astype(int), cmap='viridis')
plt.colorbar(scatter, label='Fecha')
plt.xlabel('PC1')
plt.ylabel('PC2')
plt.title('Componentes Principales por Fecha')
plt.show()
