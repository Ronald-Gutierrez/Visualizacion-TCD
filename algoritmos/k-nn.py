import pandas as pd
from scipy.spatial import distance

# Datos de estaciones AQI
aqi_stations = pd.DataFrame({
    'stationId': [
                'aotizhongxin_aq', 'badaling_aq', 'beibuxinqu_aq', 'daxing_aq', 'dingling_aq',
                'donggaocun_aq', 'dongsi_aq', 'dongsihuan_aq', 'fangshan_aq', 'fengtaihuayuan_aq',
                'guanyuan_aq', 'gucheng_aq', 'huairou_aq', 'liulihe_aq', 'mentougou_aq',
                'miyun_aq', 'miyunshuiku_aq', 'nansanhuan_aq', 'nongzhanguan_aq', 'pingchang_aq',
                'pinggu_aq', 'qianmen_aq', 'shunyi_aq', 'tiantan_aq', 'tongzhou_aq',
                'wanliu_aq', 'wanshouxigong_aq', 'xizhimenbei_aq', 'yanqin_aq', 'yizhuang_aq',
                'yongdingmennei_aq', 'yongledian_aq', 'yufa_aq', 'yungang_aq', 'zhiwuyuan_aq'
            ],
    'latitude': [
                39.9829, 40.3657, 40.0906, 39.7189, 40.2925,
                40.1006, 39.9296, 39.9392, 39.7425, 39.8631,
                39.9293, 39.9144, 40.3288, 39.5807, 39.9375,
                40.3706, 40.4999, 39.8562, 39.8040, 40.2176,
                40.1643, 39.8996, 40.1270, 39.8865, 39.8861,
                39.9875, 39.8785, 39.9546, 40.4537, 39.7950,
                39.8764, 39.7355, 40.2126, 39.8244, 40.0027
            ],
    'longitude': [
                116.3974, 115.9887, 116.1749, 116.4040, 116.2204,
                117.1201, 116.4170, 116.4837, 115.9905, 116.2795,
                116.3399, 116.1841, 116.6280, 116.0007, 116.1064,
                116.9265, 116.9116, 116.3682, 116.4612, 116.2304,
                117.0994, 116.3958, 116.6552, 116.4074, 116.6633,
                116.2873, 116.3526, 116.3494, 115.9727, 116.5065,
                116.3943, 116.7838, 116.3003, 116.1466, 116.2076
            ]
})

# Datos de estaciones MEO
meo_stations = pd.DataFrame({
    'stationId': ['shunyi_meo', 'hadian_meo', 'yanqing_meo', 'miyun_meo', 'huairou_meo',
                  'shangdianzi_meo', 'pinggu_meo', 'tongzhou_meo', 'chaoyang_meo', 'pingchang_meo',
                  'zhaitang_meo', 'mentougou_meo', 'beijing_meo', 'shijingshan_meo', 'fengtai_meo',
                  'daxing_meo', 'fangshan_meo', 'xiayunling_meo'],
    'longitude': [116.615278, 116.290556, 115.968889, 116.864167, 116.626944, 
                  117.111667, 117.117778, 116.756667, 116.500833, 116.211667, 
                  115.692222, 116.156389, 116.469444, 116.205278, 116.245278, 
                  116.354444, 116.194167, 115.740556],
    'latitude': [40.126667, 39.986944, 40.449444, 40.377500, 40.357778, 
                 40.658889, 40.169444, 39.847500, 39.952500, 40.223333, 
                 39.973889, 39.887778, 39.806111, 39.942500, 39.870278, 
                 39.718611, 39.773056, 39.728611]
})

# Crear una función para encontrar la estación MEO más cercana
def find_nearest_meo(aqi_station, meo_stations):
    aqi_coords = [aqi_station['longitude'], aqi_station['latitude']]
    min_distance = float('inf')
    nearest_station = None
    
    for index, meo_station in meo_stations.iterrows():
        meo_coords = [meo_station['longitude'], meo_station['latitude']]
        dist = distance.euclidean(aqi_coords, meo_coords)
        
        if dist < min_distance:
            min_distance = dist
            nearest_station = meo_station['stationId']
    
    return nearest_station

# Encontrar la estación MEO más cercana para cada estación AQI
nearest_meo_list = []

for index, aqi_station in aqi_stations.iterrows():
    nearest_meo = find_nearest_meo(aqi_station, meo_stations)
    nearest_meo_list.append({
        'aqi_stationId': aqi_station['stationId'],
        'nearest_meo_stationId': nearest_meo
    })

# Convertir a DataFrame y guardar como CSV
nearest_meo_df = pd.DataFrame(nearest_meo_list)
nearest_meo_df.to_csv('k_nn_PCA.csv', index=False)
