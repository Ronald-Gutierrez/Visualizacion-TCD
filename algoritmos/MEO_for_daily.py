import pandas as pd

# Cargar los datos desde el archivo CSV
input_file = 'data/beijing_17_18_meo.csv'
data = pd.read_csv(input_file)

# Convertir la columna 'utc_time' a tipo datetime
data['utc_time'] = pd.to_datetime(data['utc_time'])

# Crear una nueva columna 'date' que solo contiene la fecha (sin la hora)
data['date'] = data['utc_time'].dt.date

# Seleccionar las columnas relevantes
columns = ['station_id', 'date', 'temperature', 'pressure', 'humidity', 'wind_direction', 'wind_speed']
data = data[columns]

# Agrupar por 'station_id' y 'date', y calcular la media de los otros atributos
daily_data = data.groupby(['station_id', 'date']).mean().reset_index()

# Redondear los valores a 3 decimales
daily_data = daily_data.round(2)

# Guardar el resultado en un nuevo archivo CSV
output_file = 'data/daily_meo_output.csv'
daily_data.to_csv(output_file, index=False)

print(f'Datos procesados y guardados en {output_file}')
