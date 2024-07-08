import pandas as pd

# Mapeo de traducción de etiquetas de clima
weather_translation = {
    'Sunny/clear': 'Despejado/Soleado',
    'Haze': 'Neblina',
    'Snow': 'Nieve',
    'Fog': 'Niebla',
    'Rain': 'Lluvia',
    'Dust': 'Polvo',
    'Sand': 'Arena',
    'Sleet': 'Aguanieve',
    'Rain/Snow with Hail': 'Lluvia/Nieve con Granizo',
    'Rain with Hail': 'Lluvia con Granizo'
}

# Leer el archivo CSV
data = pd.read_csv('data/beijing_17_18_meo.csv')

# Convertir utc_time a formato de fecha
data['date'] = pd.to_datetime(data['utc_time']).dt.date

# Agrupar por fecha y calcular los promedios diarios de longitude, latitude, wind_direction y wind_speed
daily_means = data.groupby(['station_id', 'date'])[['longitude', 'latitude', 'wind_direction', 'wind_speed']].mean().reset_index()

# Redondear los valores de longitude, latitude y wind_speed a un decimal
daily_means['longitude'] = daily_means['longitude']
daily_means['latitude'] = daily_means['latitude']
daily_means['wind_direction'] = daily_means['wind_direction'].mod(360).round(1)
daily_means['wind_speed'] = daily_means['wind_speed'].round(1)

# Calcular el clima más común por día
weather_mode = data.groupby('date')['weather'].agg(lambda x: x.mode()[0]).reset_index()
weather_mode.columns = ['date', 'weather']

# Traducir las etiquetas de clima al español
weather_mode['weather'] = weather_mode['weather'].map(weather_translation)

# Contar las ocurrencias de cada clima por día
weather_counts = data.groupby('date')['weather'].value_counts().reset_index(name='count')

# Ordenar por fecha y contar en orden descendente para cada grupo de fecha
weather_sorted = weather_counts.sort_values(by=['date', 'count'], ascending=[True, False])

# Seleccionar el clima más común por día (primer registro después de ordenar)
weather_mode = weather_sorted.groupby('date').first().reset_index()

# Fusionar con los promedios diarios
daily_means = pd.merge(daily_means, weather_mode[['date', 'weather']], on='date', how='left')

# Aplicar la traducción de etiquetas al dataframe principal
daily_means['weather'] = daily_means['weather'].map(weather_translation)

# Guardar el resultado en un nuevo archivo CSV
daily_means.to_csv('data/speed_wind_weather_for_day.csv', index=False)
