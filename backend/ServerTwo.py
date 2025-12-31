from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from datetime import date
from sqlmodel import SQLModel, Field, Session, create_engine, select
from sqlalchemy import text

from contextlib import asynccontextmanager
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


# ================= SERVER =================

class APIServer:
    def __init__(self, dbprocessor: bool = False):

        # Ensure that the database URL is correctly set.
        self.db_url = "mysql+pymysql://root:TriCeption123@localhost:3306/fydb"
        self.engine = create_engine(self.db_url, echo=True)
        self.dirPath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Datasets")

        self.stations = ["Msida","St. Paul's Bay", "Gharb", "Attard"]

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

        

    def __cleanDataFrame(self, df):

        '''Cleans the dataframe by handling NAN values, converting data types and grouping by date.'''  
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
   
    def __calculate_town_distance(self, lat1, lon1, lat2, lon2):
        '''Haversine formula to calculate distance between two lat/lon points'''
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
            df = self.__cleanDataFrame(df)

            lengths.append(df.shape[0])

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

                for row in range(0, lim):
                    townData = {}
                    townData['town'] = town
                    townLat, townLon = townsCoordinates[town]
                    pollutants = ['NO2 (µg/m3)', 'SO2 (µg/m3)', 'O3 (µg/m3)', 'PM10 (µg/m3)', 'PM2.5 (µg/m3)', 'NO (µg/m3)']
                    inverseDistance = 0

                    for p in pollutants:
                        # print(f"Processing pollutant {p} for town {town} at row {row}")
                        pollutantSum = 0
                        # Go through each station
                        for station in self.stations:


                            df = pd.read_excel(path, sheet_name=station, na_values=['na'])

                            df = self.__cleanDataFrame(df)

                            townData['Date'] = df.iloc[row]['Date'].date()

                            stationLat, stationLon = stationsTownMap[station]['coordinates']
                            distance = self.__calculate_town_distance(townLat, townLon, stationLat, stationLon)
                            # print(f"Distance from {town} to station {station} is {distance} km")

                            # print(f"Accessing {row}, pollutant {p}, station {station}")
                            # print(df.iloc[row])
                            try:
                                pollutantSum += float(df.iloc[row][p] / distance) if df.iloc[row][p] != 0 else 0

                                inverseDistance += 1 / distance
                            except Exception as e:
                                print(f"Error accessing row {row} for station {station}, pollutant {p}: {e}")
                        
                        townData[p] = math.floor(( pollutantSum / inverseDistance ) * 100) / 100 if inverseDistance != 0 else 0

                        print(f"Pollutant {p} for town {town} at row {row} is {townData[p]} ")
                    data.append(townData)
                    object = Pollutants(
                        town = townData['town'],
                        no2_ugm3 = townData['NO2 (µg/m3)'],
                        no_ugm3= townData['NO (µg/m3)'],
                        so_ugm3 = townData['SO2 (µg/m3)'],
                        o_ugm3 = townData['O3 (µg/m3)'],
                        pm10_ugm3 = townData['PM10 (µg/m3)'],
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
        '''Used to register each individual endpoint for the API server.'''

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
