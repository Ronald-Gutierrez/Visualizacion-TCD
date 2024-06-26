import pandas as pd

# Leer los datos del CSV
data = pd.read_csv('data/beijing_17_18_aq.csv')

# Valores específicos para cada contaminante según la tabla proporcionada
BPLo_values = {
    'PM2.5': [0, 35, 75, 115, 150, 250],
    'PM10': [0, 50, 150, 250, 350, 420],
    'SO2': [0, 50, 150, 475, 800, 1600],
    'NO2': [0, 40, 80, 180, 280, 565],
    'CO': [0, 2, 4, 14, 24, 36],
    'O3': [0, 160, 200, 300, 400, 800]
}

BPHi_values = {
    'PM2.5': [35, 75, 115, 150, 250, 350],
    'PM10': [50, 150, 250, 350, 420, 500],
    'SO2': [50, 150, 475, 800, 1600, 2100],
    'NO2': [40, 80, 180, 280, 565, 750],
    'CO': [2, 4, 14, 24, 36, 48],
    'O3': [160, 200, 300, 400, 800, 1000]
}

IAQILo_values = {
    'PM2.5': [0, 50, 100, 150, 200, 300],
    'PM10': [0, 50, 100, 150, 200, 300],
    'SO2': [0, 50, 100, 150, 200, 300],
    'NO2': [0, 50, 100, 150, 200, 300],
    'CO': [0, 50, 100, 150, 200, 300],
    'O3': [0, 50, 100, 150, 200, 300]
}

IAQIHi_values = {
    'PM2.5': [50, 100, 150, 200, 300, 400],
    'PM10': [50, 100, 150, 200, 300, 400],
    'SO2': [50, 100, 150, 200, 300, 400],
    'NO2': [50, 100, 150, 200, 300, 400],
    'CO': [50, 100, 150, 200, 300, 400],
    'O3': [50, 100, 150, 200, 300, 400]
}

# Calcular IAQI para cada contaminante
def calculate_IAQI(concentration, pollutant):
    for i in range(len(BPLo_values[pollutant])):
        if BPLo_values[pollutant][i] <= concentration <= BPHi_values[pollutant][i]:
            BPLo = BPLo_values[pollutant][i]
            BPHi = BPHi_values[pollutant][i]
            IAQILo = IAQILo_values[pollutant][i]
            IAQIHi = IAQIHi_values[pollutant][i]
            IAQIp = ((IAQIHi - IAQILo) / (BPHi - BPLo)) * (concentration - BPLo) + IAQILo
            return IAQIp
    return None  # Si la concentración no se encuentra en ningún rango, devolver None

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

# Agrupar los datos originales por 'stationId' y 'date' para calcular promedios
data['utc_time'] = pd.to_datetime(data['utc_time'])
data['date'] = data['utc_time'].dt.date
grouped_data = data.groupby(['stationId', 'date']).agg({
    'PM2.5': 'mean',
    'PM10': 'mean',
    'NO2': 'mean',
    'CO': 'mean',
    'O3': 'mean',
    'SO2': 'mean'
}).reset_index()

# Calcular IAQI y clasificar el AQI promedio para cada contaminante en cada día
for pollutant in ['PM2.5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']:
    grouped_data[f'{pollutant}_IAQI'] = grouped_data[pollutant].apply(lambda x: calculate_IAQI(x, pollutant))
    grouped_data[f'{pollutant}'] = grouped_data[f'{pollutant}_IAQI'].apply(classify_AQI)

# Guardar los resultados en un nuevo archivo CSV
grouped_data.to_csv('data/real-daily_aqi_output.csv', columns=['stationId', 'date', 'PM2.5', 'PM10', 'NO2', 'CO', 'O3', 'SO2'], index=False)
