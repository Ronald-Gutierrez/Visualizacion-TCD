import pandas as pd
import numpy as np

# Leer los datos del CSV
data = pd.read_csv('data/beijing_17_18_aq.csv')

# Filtrar por estación aotizhongxin_aq
station_data = data[data['stationId'] == 'aotizhongxin_aq']

# Definir límites para IAQI según la normativa china HJ633-2012
limits = {
    'PM2.5': [(0, 35, 50), (35, 75, 100), (75, 115, 150), (115, 150, 200), (150, 250, 300), (250, 350, 400), (350, 500, 500)],
    'PM10': [(0, 50, 50), (50, 150, 100), (150, 250, 150), (250, 350, 200), (350, 420, 300), (420, 500, 400), (500, 600, 500)],
    'SO2': [(0, 50, 50), (50, 150, 100), (150, 475, 150), (475, 800, 200), (800, 1600, 300), (1600, 2100, 400), (2100, 2620, 500)],
    'NO2': [(0, 40, 50), (40, 80, 100), (80, 180, 150), (180, 280, 200), (280, 565, 300), (565, 750, 400), (750, 940, 500)],
    'CO': [(0, 2, 50), (2, 4, 100), (4, 14, 150), (14, 24, 200), (24, 36, 300), (36, 48, 400), (48, 60, 500)],
    'O3': [(0, 100, 50), (100, 160, 100), (160, 215, 150), (215, 265, 200), (265, 800, 300), (800, 1000, 400), (1000, 1200, 500)]
}

# Función para calcular IAQI
def calculate_iaqi(pollutant, concentration):
    for (bp_lo, bp_hi, iaqi_hi) in limits[pollutant]:
        if bp_lo <= concentration <= bp_hi:
            iaqi_lo = (iaqi_hi / bp_hi) * bp_lo
            iaqi = ((iaqi_hi - iaqi_lo) / (bp_hi - bp_lo)) * (concentration - bp_lo) + iaqi_lo
            return iaqi
    return np.nan

# Aplicar la fórmula del IAQI
for pollutant in ['PM2.5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']:
    station_data[f'IAQI_{pollutant}'] = station_data[pollutant].apply(lambda x: calculate_iaqi(pollutant, x))

# Calcular el AQI como el máximo IAQI de los contaminantes
station_data['AQI'] = station_data[[f'IAQI_{pollutant}' for pollutant in ['PM2.5', 'PM10', 'NO2', 'CO', 'O3', 'SO2']]].max(axis=1)

# Convertir a escala diaria y calcular el AQI promedio diario
station_data['utc_time'] = pd.to_datetime(station_data['utc_time'])
station_data.set_index('utc_time', inplace=True)
daily_aqi = station_data['AQI'].resample('D').mean().reset_index()

# Generar secuencias y grafos
daily_aqi['AQI_Level'] = pd.cut(daily_aqi['AQI'], bins=[0, 50, 100, 150, 200, 300, 500], labels=[1, 2, 3, 4, 5, 6])

# Construir el archivo CSV de salida
daily_aqi.to_csv('aqi2.csv', index=False)
