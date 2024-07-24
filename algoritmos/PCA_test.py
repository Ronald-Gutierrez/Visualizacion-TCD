import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt

# Generar un rango de fechas y horas
fechas = pd.date_range(start='2024-07-01', end='2027-07-10', freq='D')
horas = ['12:00'] * len(fechas)
num_datos = len(fechas)

# Generar datos sintéticos de contaminación con diferentes niveles
def generar_datos_contaminacion(num_datos):
    contaminantes = ['PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']
    niveles_contaminacion = ['bajo', 'mediano', 'alto', 'moderado']
    datos_contaminacion = {cont: [] for cont in contaminantes}
    niveles = np.random.choice(niveles_contaminacion, num_datos)

    for i in range(num_datos):
        for cont in contaminantes:
            if niveles[i] == 'bajo':
                datos_contaminacion[cont].append(np.random.uniform(5, 60))
            elif niveles[i] == 'mediano':
                datos_contaminacion[cont].append(np.random.uniform(60, 100))
            elif niveles[i] == 'alto':
                datos_contaminacion[cont].append(np.random.uniform(180, 250))
            elif niveles[i] == 'moderado':
                datos_contaminacion[cont].append(np.random.uniform(100, 170))

    return pd.DataFrame(datos_contaminacion)

contaminacion_df = generar_datos_contaminacion(num_datos)

# Generar datos sintéticos de meteorología
meteorologia_df = pd.DataFrame({
    'temperature': np.random.uniform(15, 35, num_datos),
    'pressure': np.random.uniform(990, 1030, num_datos),
    'humidity': np.random.uniform(20, 100, num_datos),
    'wind_direction': np.random.uniform(0, 360, num_datos),
    'wind_speed': np.random.uniform(0, 15, num_datos),
    'date': fechas,
    'time': horas
})

# Fusionamos los dos dataframes en base a las columnas 'date' y 'time'
df_combinado = pd.concat([contaminacion_df, meteorologia_df], axis=1)

# Normalización
scaler = StandardScaler()
caracteristicas = df_combinado[['PM2_5', 'PM10', 'NO2', 'CO', 'O3', 'SO2', 'temperature', 'pressure', 'humidity', 'wind_direction', 'wind_speed']]
caracteristicas_normalizadas = scaler.fit_transform(caracteristicas)

pca = PCA(n_components=2)
componentes_principales = pca.fit_transform(caracteristicas_normalizadas)

# Crear un DataFrame con los componentes principales
df_componentes_principales = pd.DataFrame(data=componentes_principales, columns=['PC1', 'PC2'])
df_componentes_principales['date'] = fechas
df_componentes_principales['time'] = horas

# Convertir las fechas a enteros
df_componentes_principales['date_int'] = pd.to_datetime(df_componentes_principales['date']).astype('int64')

# Guardar el DataFrame combinado en un archivo CSV
df_componentes_principales.to_csv('PCA.csv', index=False)

# Graficar los componentes principales por fecha
plt.figure(figsize=(10, 6))
scatter = plt.scatter(df_componentes_principales['PC1'], df_componentes_principales['PC2'], c=df_componentes_principales['date_int'], cmap='viridis')
plt.colorbar(scatter, label='Fecha')
plt.xlabel('PC1')
plt.ylabel('PC2')
plt.title('Componentes Principales por Fecha')
plt.show()

# Varianza explicada por cada componente principal
print("Varianza explicada por cada componente principal:", pca.explained_variance_ratio_)
print("Varianza explicada acumulada:", pca.explained_variance_ratio_.sum())
