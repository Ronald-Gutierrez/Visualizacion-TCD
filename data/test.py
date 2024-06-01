import pandas as pd

# Leer los datos del CSV
data = pd.read_csv('data/beijing_17_18_aq.csv')

# Valores específicos para cada contaminante según la regulación de contaminantes del aire HJ633-2012 en Beijing
BPLo_values = {
    'PM2.5': 0,
    'PM10': 0,
    'SO2': 0,
    'NO2': 0,
    'CO': 0,
    'O3': 0
}

BPHi_values = {
    'PM2.5': 75,
    'PM10': 150,
    'SO2': 150,
    'NO2': 100,
    'CO': 5,
    'O3': 300
}

IAQILo_values = {
    'PM2.5': 0,
    'PM10': 0,
    'SO2': 0,
    'NO2': 0,
    'CO': 0,
    'O3': 0
}

IAQIHi_values = {
    'PM2.5': 200,
    'PM10': 200,
    'SO2': 200,
    'NO2': 200,
    'CO': 200,
    'O3': 200
}

# Calcular IAQI para cada contaminante
def calculate_IAQI(concentration, pollutant):
    BPLo = BPLo_values[pollutant]
    BPHi = BPHi_values[pollutant]
    IAQILo = IAQILo_values[pollutant]
    IAQIHi = IAQIHi_values[pollutant]
    
    # Calcular IAQI según la fórmula proporcionada
    IAQIp = ((IAQIHi - IAQILo) / (BPHi - BPLo)) * (concentration - BPLo) + IAQILo
    return IAQIp

# Función para clasificar el AQI en niveles del 1 al 6
def classify_AQI(aqi):
    if aqi is None or pd.isna(aqi):
        return 0  # Sin valor
    elif aqi <= 50:
        return 1  # Excelente
    elif 51 <= aqi <= 100:
        return 2  # Bueno
    elif 101 <= aqi <= 150:
        return 3  # Moderado
    elif 151 <= aqi <= 200:
        return 4  # Malo
    elif 201 <= aqi <= 300:
        return 5  # Muy malo
    else:
        return 6  # Peligroso

# Aplicar la función de cálculo de IAQI para cada contaminante
pollutants = ['PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3']
for pollutant in pollutants:
    data[f'{pollutant}_IAQI'] = data.apply(lambda x: calculate_IAQI(x[pollutant], pollutant), axis=1)

# Calcular AQI como el máximo IAQI de todos los contaminantes
data['AQI'] = data[[f'{pollutant}_IAQI' for pollutant in pollutants]].max(axis=1)

# Aplicar la función de clasificación del AQI a cada contaminante
for pollutant in pollutants:
    data[f'{pollutant}'] = data[f'{pollutant}_IAQI'].apply(classify_AQI)

# Guardar los resultados en un nuevo archivo CSV
data.to_csv('aqi_output.csv', columns=['stationId', 'utc_time', 'PM2.5', 'PM10', 'SO2', 'NO2', 'CO', 'O3'], index=False)
