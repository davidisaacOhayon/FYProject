from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from datetime import date
from sqlmodel import SQLModel, Field, Session, create_engine, func, select
from sqlalchemy import text
from pydantic import BaseModel
import numpy as np 
from collections import Counter
import calendar
import datetime
import logging
from contextlib import asynccontextmanager
from sklearn.cluster import KMeans


import pandas as pd
import os
import time
import math
# from pandasTest import getUsableDatasetLength
from stations import stationsTownMap, townsCoordinates
# ================= MODELS =================

class Pollutants(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    town: str | None = None
    no_ugm3: float | None = None
    no2_ugm3: float | None = None
    so_ugm3: float | None = None
    o_ugm3: float | None = None
    pm10_ugm3: float | None = None
    pm25_ugm3: float | None = None
    day: date | None = None


# ================= INTERNAL CLASS MODELS =================

class ClusterTownData():
    def __init__(self, town, data):
        self.town: str = town
        self.data: list = data


    def __str__(self):
        return f"Town: {self.town}, Data: {self.data}"

# ================= PAYLOAD MODELS =================

class TownsPollutantPayload(BaseModel):
    towns: list[str]
    pollutant: str

class TownPollutantPayload(BaseModel):
    town: str
    pollutant: str

# ================= SERVER =================

class APIServer:
    def __init__(self, dbprocessor: bool = False):

        self.pollutantDBKeyMap = {
                "SO" : "so_ugm3",
                "NO2" : "no2_ugm3",
                "PM10" : "pm10_ugm3",
                "PM25" : "pm25_ugm3",
                "NO": "no_ugm3",
                "O3" : "o_ugm3"
            }

        # Ensure that the database URL is correctly set.
        self.db_url = "mysql+pymysql://root:TriCeption123@localhost:3306/fydb"
        self.engine = create_engine(self.db_url, echo=True)
        self.dirPath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Datasets")

        self.stations = ["Msida","St. Paul's Bay", "Gharb", "Attard", "Zejtun"]

        self.app = FastAPI(lifespan=self.lifespan)

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )

        if not self.check_db_connection():
            raise Exception("Database connection failed.")
        
        self.populate_db() if dbprocessor else None

        self.register_routes()

    

    def __cluster_town(self, input):
        
        _data = input.data
        _town = input.town

        # Present pollutant readings in an array
        polArray = np.array([[d["val"]] for d in _data])

        # Fit into clusters with K-means
        kmeans = KMeans(n_clusters=3, random_state=0, n_init="auto").fit(polArray)
        
        clusters = list(dict.fromkeys(kmeans.labels_))

        samples = [{"Month" : r["day"], "Value" : r["val"], "Cluster" : int(c)} for r,c in zip(_data, kmeans.labels_)]
        
        clusterGroups = { int(a) : [{"Month" : s["Month"], "Value" : s["Value"] } for s in samples if a == s["Cluster"] ] for a in clusters }
        
        clusterCounter = {}

        # Process Each Cluster
        for cluster in clusterGroups.keys():
            c = {}
            coverage = 0
            # Get months
            months = []
            #  Go through each set in cluster groups
            for s in clusterGroups[cluster]:
                # If the read month isn't recorded
                if s["Month"] not in months:
                    # Add to list
                    months.append(s["Month"])
            
            # Go through each month
            for month in months:
                # Count occurence
                dayCount = sum(1 for d in clusterGroups[cluster] if d["Month"] == month )
                # print(f"{month} : {dayCount}" )

                coverage += dayCount
                c[month[:3]] = dayCount

            minVal = min([s["Value"] for s in clusterGroups[cluster]])
            maxVal = max([s["Value"] for s in clusterGroups[cluster]])

            clusterCounter[cluster] = {"min": minVal, "max" : maxVal, "data": c, "coverage" : round((coverage / 365) * 100, 2)}

        # Sort Clusters (low,med,high exposure)
        clusterCounter = dict(sorted(clusterCounter.items(), key=lambda item: item[1]['max']))
        # Re-index clusters to order them by exposure level
        clusterCounter = {i : v for i,v in enumerate(clusterCounter.values())}

        # clusterCounter["coordinates"] = townsCoordinates[_town]

        return clusterCounter



    def __cleanDataFrame(self, df):

        '''Cleans the dataframe by handling NAN values, converting data types and grouping by date.'''  
        # Convert 'Date' & 'DatePM' column to datetime, coerce errors
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce', dayfirst=True)
        df['DatePM'] = pd.to_datetime(df['DatePM'], errors='coerce', dayfirst=True)
 
        # Drop rows where 'Date' is NaT
        df = df.dropna(subset=["Date"]) 
 

        # Convert all column names to numeric
        for col in df.columns:
            if col != 'Date' and col != 'DatePM':
                df[col] = pd.to_numeric(df[col], errors='coerce')
        # Fill NaN values in numeric columns with 0
        num_cols = df.select_dtypes(include="number").columns
    
        df[num_cols] = df[num_cols].fillna(0)

        # we will have to copy over
        # The daily aggregates of the PM readings.

        pm_df = df[['DatePM', 'PM2.5 (µg/m3)', 'PM10 (µg/m3)']].copy()

        # Group by 'Date' and calculate mean for numeric columns for each day   
        df = df.groupby("Date", as_index=False).mean(numeric_only=True)
 
        return df, pm_df
   
    def __calculate_town_distance(self, lat1, lon1, lat2, lon2):
        '''Haversine formula to calculate distance between two lat/lon points
        Returns distance in km'''
        R = 6371.0  # km

        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)

        a = (
            math.sin(dphi / 2) ** 2
            + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        )

        return 2 * R * math.asin(math.sqrt(a))

    def check_db_connection(self) -> bool:
        '''Checks if the database connection is successfully established.'''
        with Session(self.engine) as session:
            try:
                session.exec(select(Pollutants)).first()
                return True 
            except Exception as e:
                return False
            
    @asynccontextmanager
    async def lifespan(self, app: FastAPI):
        '''Lifespan function which handles startup code and shut down.'''
        print("Creating tables...", flush=True)
        SQLModel.metadata.create_all(self.engine)
        yield
        print("Shutdown complete.", flush=True)

    def populate_db(self):
        '''Will iterate through each file found within the defined file path,
           can handle csv / xlsx files.'''
    
        files = os.listdir(self.dirPath)

        for file in files:
            # Get each file and it's extension within the dir
            filename, ext = os.path.splitext(file)
            print(f"{filename}  {ext}")

            match(ext):
                case ".xlsx": self.__handleXLSXFile(os.path.join(self.dirPath, file))
                case _: print("Invalid Dataset file found, skipping")


    def __getUsableDatasetLength(self, path):
        lengths = []
        for station in self.stations:
            df = pd.read_excel(path, sheet_name=station, na_values=['na'])
            # Optimize this please, we should really just clean the dataframe once.
            df, pm_df = self.__cleanDataFrame(df)
            print(df.shape)
            lengths.append(df.shape[0])

        print(f"Dataset lengths for each station: {lengths}")
        return min(lengths)
    
    def __handleXLSXFile(self, path):   
        with Session(self.engine) as session:
            # lim = getUsableDatasetLength(path)
            mainData = {}

            towns = townsCoordinates.keys()
            print(f"Towns to process: {len(towns)}")
            count = 0

            timeNow = time.time()
            # Go through each town
            for town in towns:
                print("count:", count)
                count += 1
                data = []
                lim = self.__getUsableDatasetLength(path)
                print(f"Usable dataset length: {lim}")

                # Iterate through each data row for the town
                for row in range(0, lim):
                    townData = {}
                    townData['town'] = town
                    townLat, townLon = townsCoordinates[town]
                    pollutants = ['NO2 (µg/m3)', 'SO2 (µg/m3)', 'O3 (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)']
                    # go through each pollutant
                    for p in pollutants:
                        inverseDistance = 0
                        # print(f"Processing pollutant {p} for town {town} at row {row}")
                        # Keep track of pollutant sum
                        pollutantSum = 0
                        print(f"Processing pollutant {p} ---------------------------------------------------------------")

                        # Go through each station available
                        for station in self.stations:
                            # Read the station data 
                            df = pd.read_excel(path, sheet_name=station, na_values=['na'])
                            # Clean data frame by handling NAN values, converting data types and grouping by date
                            # Contains main dataframe for NO2,SO2, and O3, and   a separate dataframe for PM10 and PM2.5
                            df, pm_df = self.__cleanDataFrame(df)
   
                        

                            # Get date for current row
                            townData['Date'] = df.iloc[row]['Date']


                            # Get PM10 and PM2.5 values for the town based on the date of the current row and station
                            # Congrats to ERA for not formatting the date in the same way across all stations,
                            # so we have to do this for each station instead of just once per row

                            # Get station coordinates
                            stationLat, stationLon = stationsTownMap[station]['coordinates']

                            # Calculated distance from station to current town
                            distance = round(self.__calculate_town_distance(townLat, townLon, stationLat, stationLon), 2)


                            print(f"Distance from {town} to station {station} is {distance} km")

                            print(f"Accessing {row}, pollutant {p}, station {station}")
                            # print(df.iloc[row])
                            
                            # Check if we are accessing PM10 PM25
                            if (p == "PM10 (µg/m3)" or p == "PM2.5 (µg/m3)"):
                                # Access PM10 and PM2.5 rows of the current station and date
                                print(f"Accessing PM Data for station {station} on {pm_df.loc[pm_df['DatePM'] == townData['Date']][p].iloc[0]} µg/m3")
                                pollutantSum += pm_df.loc[pm_df['DatePM'] == townData['Date']][p].iloc[0] / distance
                                # Average the PM Values
                                inverseDistance += 1 / distance
              

                            else:
                                # Average the concentration values from each station for the current pollutant
                                try:
                                    pollutantSum += float(df.iloc[row][p] / distance) if df.iloc[row][p] != 0 else 0
                                    print(f"Pollutant value from station {station} for pollutant {p} is {df.iloc[row][p]} µg/m3, contributing {float(df.iloc[row][p] / distance) if df.iloc[row][p] != 0 else 0} µg/m3 to the town's pollutant sum")
                                    inverseDistance += 1 / distance
                                except Exception as e:
                                    print(f"Error accessing row {row} for station {station}, pollutant {p}: {e}")


                        print(f"Total pollutant sum for {p} in town {town} at row {row} is {pollutantSum} with inverse distance sum of {inverseDistance}")
                        townData[p] = math.floor(( pollutantSum / inverseDistance ) * 100) / 100 if inverseDistance != 0 else 0

                        print(f"Pollutant {p} for town {town} at row {row} is {townData[p]} ")



                    data.append(townData)
                    print(f"Finalized Pollutant Record town:{town} date:{townData['Date']} NO2:{townData['NO2 (µg/m3)']} SO2:{townData['SO2 (µg/m3)']} O3:{townData['O3 (µg/m3)']} PM10:{townData['PM10 (µg/m3)']} PM25:{townData['PM2.5 (µg/m3)']}")
                    object = Pollutants(
                        town = townData['town'],
                        no2_ugm3 = townData['NO2 (µg/m3)'],
                        no_ugm3= 0,
                        so_ugm3 = townData['SO2 (µg/m3)'],
                        o_ugm3 = townData['O3 (µg/m3)'],
                        pm10_ugm3 = townData['PM10 (µg/m3)'] if 'PM10 (µg/m3)' in townData else 0,
                        pm25_ugm3 = townData['PM2.5 (µg/m3)'],
                        day = townData['Date']
                    )
                    session.add(object)
                print(f"Finished processing town: {town}")
                session.commit()

            timefinish = time.time()
            print(f"Time taken to process dataset: {timefinish - timeNow}")



                # mainData[town] = data

    def get_session(self):
        '''Individualizes each DB request within a session to prevent conflicts.'''
        with Session(self.engine) as session:
            yield session

    SessionDep = Annotated[Session, Depends(get_session)]

    def register_routes(self):
        '''Used to register each individual endpoint for the API server.
            \n **API End Points:**
            \n */getTownExpPolCluster/* - Clusters records of a town's annual pollutant reading


        '''


        @self.app.get("/getTownsReadingsOnDate")
        def get_town_readings_date(date: date, session: Session = Depends(self.get_session)):
            '''Returns all towns pollutant readings on a specific date.'''
            query = select(Pollutants).where(Pollutants.day == date)
            return session.exec(query).all()
    
        @self.app.get("/getEDATownPol")
        def get_eda_town_pol(town: str, pollutant: str, session: Session = Depends(self.get_session)):
            '''Returns all records of a town's pollutant readings for EDA purposes.'''
            
            # Get column of pollutant
            col = getattr(Pollutants, self.pollutantDBKeyMap[pollutant])

            query = (
                    select(
                        Pollutants.town,
                        col,
                        Pollutants.day
                    )
                    .where(Pollutants.town == town)
                )
            
            # Retrieve result
            result = session.exec(query).all()

            # Calculate Standard Deviation
            values = [getattr(r, col.key) for r in result]
            if values:
                std_dev = round(np.std(values), 3)
            else:
                std_dev = 0.0

            # Calculate Mean
            if values:
                mean = round(np.mean(values), 3)
            else:                
                mean = 0.0

            # Calculate Interquartile Range
            if values:
                q1 = round(np.percentile(values, 25), 3)
                q3 = round(np.percentile(values, 75), 3)
                iqr = round(q3 - q1, 3)
            else:
                iqr = 0.0

            # Retrieve Min Max Values
            if values:
                min = round(np.min(values), 3)
                max = round(np.max(values), 3)
            else:                
                min = 0.0
                max = 0.0

            
            return {"Q1": q1, "Q3": q3, "IQR" : iqr, "Mean": mean, "STD_Dev": std_dev, "Min": min, "Max": max}
        

        @self.app.get("/getTownExpPolClusters")
        def cluster_towns(pollutant: str, session: Session = Depends(self.get_session)):
            '''Clusters all towns by their yearly pollutant readings and return all cluster counts of all exposure levels.'''
            
            # Get column of pollutant
            col = getattr(Pollutants, self.pollutantDBKeyMap[pollutant])


            payload = []
            # Iterate through each town
            for town in ["Attard", "Mosta"]:
                query = (
                    select(Pollutants.town, col, Pollutants.day)
                    .where(Pollutants.town == town)
                )
                # Retrieve result
                result = session.exec(query).all()

                tempData = ClusterTownData(town = town, data=[{ "val": getattr(r, col.key), "day": calendar.month_name[pd.to_datetime(r.day).month]} for r in result])

                cluster = self.__cluster_town(tempData)
                for c in cluster:
                    cluster[c].pop("data", None)
                    cluster[c].pop("min", None)
                    cluster[c].pop("max", None)
                cluster["coordinates"] = townsCoordinates[town]

                payload.append(cluster)

            return payload


        @self.app.post("/getTownExpPolCluster/")
        def cluster_town(load: TownPollutantPayload, session: Session = Depends(self.get_session)):
            '''Clusters yearly pollution reading of town upon specific pollutant and returns cluster counts of all exposure levels.'''
           
            town = load.town
            pollutant = load.pollutant

            # Get column of pollutant
            col = getattr(Pollutants, self.pollutantDBKeyMap[pollutant])

            # Query for each record of town's pollutant reading.
            query = (
                    select(
                        Pollutants.town,
                        col,
                        Pollutants.day
                    )
                    .where(Pollutants.town == town)
                )
            
            # Retrieve result
            result = session.exec(query).all()

            tempData = ClusterTownData(town = town, data= [{ "val": getattr(r, col.key), "day": calendar.month_name[pd.to_datetime(r.day).month]} for r in result])

            cluster = self.__cluster_town(tempData)

            return cluster



            

        @self.app.get("/getTown/{id}")
        def get_town(id: int, session: Session = Depends(self.get_session)):
            row = session.get(Pollutants, id)
            if not row:
                return {"error": "Not found"}
            return row

        @self.app.get("/getPollutantVolTown/")
        def get_pollutants_by_town(
            town: str,
            start_date: date | None = None,
            end_date: date | None = None,
            session: Session = Depends(self.get_session),
        ):
            query = select(Pollutants).where(Pollutants.town == town)

            if start_date:
                query = query.where(Pollutants.day >= start_date)
            if end_date:
                query = query.where(Pollutants.day <= end_date)

            return session.exec(query.order_by(Pollutants.day)).all()

        @self.app.post("/getPollutantAvgTowns/")
        def get_pollutants_avg_towns(
            payload: TownsPollutantPayload,
            start_date: date | None = None,
            end_date: date | None = None,
            session: Session = Depends(self.get_session),
        ):
            
            towns = payload.towns
            pollutant = payload.pollutant


            col = getattr(Pollutants, self.pollutantDBKeyMap[pollutant])
            
            query = (
                    select(
                        Pollutants.town,
                        func.round(func.avg(col), 3).label("avg")
                    )
                    .where(Pollutants.town.in_(towns))
                    .group_by(Pollutants.town)
                )

            if start_date:
                query = query.where(Pollutants.day >= start_date)
            if end_date:
                query = query.where(Pollutants.day <= end_date)

            return session.exec(query.order_by("avg")).mappings().all()
        

        @self.app.get("/getPollutantVol/")
        def get_pollutants(
            start_date: date | None = None,
            end_date: date | None = None,
            session: Session = Depends(self.get_session),
        ):
            query = select(Pollutants)

            if start_date:
                query = query.where(Pollutants.day >= start_date)
            if end_date:
                query = query.where(Pollutants.day <= end_date)

            return session.exec(query.order_by(Pollutants.day)).all()


# ================= RUN =================


server = APIServer(dbprocessor=False)
app = server.app
