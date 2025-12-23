import pandas as pd
import os
from stations import stationsTownMap, townsCoordinates

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


stations = ["Msida", "St. Paul's Bay", "Gharb", "Attard", "Station"]
towns = ['San Gwann']

def cleanDataFrame(df):
        # Convert 'Date' column to datetime, coerce errors
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce', dayfirst=True)
        # Drop rows where 'Date' is NaT
        df = df.dropna(subset=["Date"]) 
        # Fill NaN values in numeric columns with 0
        num_cols = df.select_dtypes(include="number").columns
        df[num_cols] = df[num_cols].fillna(0)

        # Group by 'Date' and calculate mean for numeric columns for each day   
        df = df.groupby("Date", as_index=False).mean(numeric_only=True)

        return df

def someHandleXLSXFile(path):
    row = 0

    mainData = {}

    # Go through each town
    for town in towns:
        townData = {}
        townLat, townLon = townsCoordinates[town]
        pollutants = ['NO2 (µg/m3)', 'SO (µg/m3)', 'O (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)']     
        inverseDistance = 0

        for p in pollutants:

            pollutantSum = 0
            # Go through each station
            for station in stations:

                df = pd.read_excel(path, sheet_name=station, na_values=['na'])

                df = cleanDataFrame(df)

                stationLat, stationLon = stationsTownMap[station]['coordinates']
                distance = haversine_km(townLat, townLon, stationLat, stationLon)


                pollutantSum += df.iloc[row][p] / distance if df.iloc[row][p] != 0 else 0

                inverseDistance += 1 / distance
            
            townData[p] = pollutantSum / inverseDistance if inverseDistance != 0 else 0

        if row >= len(df) - 1:
            return townData
        else:
            row += 1



someHandleXLSXFile('./Datasets/Data 2023.xlsx')



                





            


















        
    

def handleXLSXFile(path):
    currentRow = 0
    readings = {}
    pollutants = ['NO2 (µg/m3)', 'SO (µg/m3)', 'O (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)']


    for town in towns:
        townLat, townLon = townsCoordinates[town]
        stationReading = {p : 0 for p in pollutants}

        for station in stations:

            df = pd.read_excel(path, sheet_name=station, na_values=['na'])

            # Convert 'Date' column to datetime, coerce errors
            df['Date'] = pd.to_datetime(df['Date'], errors='coerce', dayfirst=True)
            # Drop rows where 'Date' is NaT
            df = df.dropna(subset=["Date"]) 
            # Fill NaN values in numeric columns with 0
            num_cols = df.select_dtypes(include="number").columns
            df[num_cols] = df[num_cols].fillna(0)

            # Group by 'Date' and calculate mean for numeric columns for each day   
            df = df.groupby("Date", as_index=False).mean(numeric_only=True)


            stationLat, stationLon = stationsTownMap[station]['coordinates']
            stationDistance = haversine_km(townLat, townLon, stationLat, stationLon)


            for _,row in df.iterrows():
                for p in pollutants:
                    stationReading[p] += row[p] / stationDistance 



        print(f"Readings for Town : {town}, {stationReading}")
        stationReading = {}
        readings[town] = stationReading

handleXLSXFile('./Datasets/Data 2023.xlsx')

 

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
