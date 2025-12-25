import pandas as pd
import os
from stations import stationsTownMap, townsCoordinates
import time
import math

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0  # kme

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )

    return 2 * R * math.asin(math.sqrt(a))


stations = [ "St. Paul's Bay", "Gharb", "Attard", "Zejtun"]
towns = ['Msida']

def cleanDataFrame(df):
        # Convert 'Date' column to datetime, coerce errors
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce', dayfirst=True)
        # Drop rows where 'Date' is NaT
        df = df.dropna(subset=["Date"]) 

        # Convert all column names to numeric
        for col in df.columns:
            if col != 'Date':
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # Fill NaN values in numeric columns with 0
        num_cols = df.select_dtypes(include="number").columns
        
        df[num_cols] = df[num_cols].fillna(0)

        # Group by 'Date' and calculate mean for numeric columns for each day   
        df = df.groupby("Date", as_index=False).mean(numeric_only=True)

        return df


def getUsableDatasetLength(path):
    lengths = []
    for station in stations:
        df = pd.read_excel(path, sheet_name=station, na_values=['na'])
        lengths.append(df.shape[0])

    return min(lengths)

def someHandleXLSXFile(path):
    lim = getUsableDatasetLength(path)
    mainData = {}

    # Go through each town

    timeNow = time.time()
    for town in towns:
        data = []
        for row in range(0, 1):
            townData = {}
            townLat, townLon = townsCoordinates[town]
            pollutants = ['NO2 (µg/m3)', 'SO2 (µg/m3)', 'O3 (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)']
            inverseDistance = 0
            

            for p in pollutants:
                # print(f"Processing pollutant {p} for town {town} at row {row}")
                pollutantSum = 0
                # Go through each station
                for station in stations:


                    df = pd.read_excel(path, sheet_name=station, na_values=['na'])

                    df = cleanDataFrame(df)

                    townData['Date'] = df.iloc[row]['Date'].date()

                    stationLat, stationLon = stationsTownMap[station]['coordinates']
                    distance = haversine_km(townLat, townLon, stationLat, stationLon)
                    # print(f"Distance from {town} to station {station} is {distance} km")

                    # print(f"Accessing {row}, pollutant {p}, station {station}")
                    # print(df.iloc[row])
                    try:
                        pollutantSum += float(df.iloc[row][p] / distance) if df.iloc[row][p] != 0 else 0

                        inverseDistance += 1 / distance
                    except Exception as e:
                        print(f"Error accessing row {row} for station {station}, pollutant {p}: {e}")
                
                townData[p] = pollutantSum / inverseDistance if inverseDistance != 0 else 0

                print(f"Pollutant {p} for town {town} at row {row} is {townData[p]} ")
            data.append(townData)
        mainData[town] = data
        print(mainData)
    return mainData



someHandleXLSXFile('./Datasets/Data 2023.xlsx')



                





            


















        
    

# def handleXLSXFile(path):
#     currentRow = 0
#     readings = {}
#     pollutants = ['NO2 (µg/m3)', 'SO (µg/m3)', 'O (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)']


#     for town in towns:
#         townLat, townLon = townsCoordinates[town]
#         stationReading = {p : 0 for p in pollutants}

#         for station in stations:

#             df = pd.read_excel(path, sheet_name=station, na_values=['na'])

#             # Convert 'Date' column to datetime, coerce errors
#             df['Date'] = pd.to_datetime(df['Date'], errors='coerce', dayfirst=True)
#             # Drop rows where 'Date' is NaT
#             df = df.dropna(subset=["Date"]) 
#             # Fill NaN values in numeric columns with 0
#             num_cols = df.select_dtypes(include="number").columns
#             df[num_cols] = df[num_cols].fillna(0)

#             # Group by 'Date' and calculate mean for numeric columns for each day   
#             df = df.groupby("Date", as_index=False).mean(numeric_only=True)


#             stationLat, stationLon = stationsTownMap[station]['coordinates']
#             stationDistance = haversine_km(townLat, townLon, stationLat, stationLon)


#             for _,row in df.iterrows():
#                 for p in pollutants:
#                     stationReading[p] += row[p] / stationDistance 



#         print(f"Readings for Town : {town}, {stationReading}")
#         stationReading = {}
#         readings[town] = stationReading

# handleXLSXFile('./Datasets/Data 2023.xlsx')

 

# class DBHandler():
#     def __init__(self,dirPath: str):
#         self.dirPath = dirPath

#         self.__populateDb()


    # def __populateDb(self):
    #     '''Will iterate through each file found within the defined file path,
    #        can handle csv / xlsx files.'''
        
    #     files = os.listdir(self.dirPath)

    #     for file in files:
    #         filename, ext = os.path.splitext(file)
    #         print(f"{filename}  {ext}")

    #         match(ext):
    #             case ".xlsx": self.__handleXLSXFile(self.dirPath + file)
    

#     def __handleXLSXFile(self, path):
#         df = pd.read_excel(path)

#         print(df['Time'])
        




# a = DBHandler('./Datasets/')
