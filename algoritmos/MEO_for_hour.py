import pandas as pd

# Cargar los datos desde el archivo CSV
input_file = 'data/beijing_17_18_meo.csv'
data = pd.read_csv(input_file)

# Convertir la columna 'utc_time' a tipo datetime
data['utc_time'] = pd.to_datetime(data['utc_time'])

# Crear nuevas columnas 'date' y 'time' que contienen la fecha y la hora
data['date'] = data['utc_time'].dt.date
data['time'] = data['utc_time'].dt.time

# Seleccionar las columnas relevantes
columns = ['station_id', 'date', 'time', 'temperature', 'pressure', 'humidity', 'wind_direction', 'wind_speed']
data = data[columns]

# Agrupar por 'station_id', 'date' y 'time', y calcular la media de los otros atributos
hourly_data = data.groupby(['station_id', 'date', 'time']).mean().reset_index()

# Redondear los valores a 2 decimales
hourly_data = hourly_data.round(2)

# Guardar el resultado en un nuevo archivo CSV
output_file = 'data/hour_meo_output.csv'
hourly_data.to_csv(output_file, index=False)

print(f'Datos procesados y guardados en {output_file}')
