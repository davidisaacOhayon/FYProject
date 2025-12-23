from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated
from datetime import date
from sqlmodel import SQLModel, Field, Session, create_engine, select
from contextlib import asynccontextmanager
import pandas as pd
import os
import math
from backend.stations import stationsTownMap, townsCoordinates
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
    def __init__(self):

        # Ensure that the database URL is correctly set.
        self.db_url = "mysql+pymysql://root:TriCeption123@localhost:3306/fydb"
        self.engine = create_engine(self.db_url, echo=True)
        self.dirPath = "./Datasets/"

        self.stations = ["Msida","St. Paul's Bay", "Gharb", "Attard", "Station"]

        self.app = FastAPI(lifespan=self.lifespan)

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )

        if not self.check_db_connection():
            raise Exception("Database connection failed.")

        self.register_routes()

    def __calculate_town_distance(lat1, lon1, lat2, lon2):
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
                case ".xlsx": self.__handleXLSXFile(self.dirPath + file)
                case _: print("Invalid Dataset file found, skipping")

    def __handleXLSXFile(self, path):
        with Session(self.engine) as session:

            for station in self.stations:

                towns = stationsTownMap[station]['towns']
                stationCoords = stationsTownMap[station]['coordinates']

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

                for town in towns:
                    townLat, townLon = townsCoordinates[town]
                    stationLat, stationLon = stationsTownMap[station]['coordinates']
                    stationDistance = self.__calculate_town_distance(townLat, townLon, stationLat, stationLon)
                    for row in df.iterrows():
                        townName = town
                        no_val = row[1]['NO (µg/m3)']
                        no2_val = row[1]['NO2 (µg/m3)']
                        so_val = row[1]['SO (µg/m3)']
                        o_val = row[1]['O (µg/m3)']
                        pm10_val = row[1]['PM10 (µg/m3)']
                        pm25_val = row[1]['PM2.5 (µg/m3)']
                        
                        no_cal





                    object = Pollutants(
                        town = row[1]['Town'],
                        no_ugm3 = row[1]['NO (µg/m3)'],
                        no2_ugm3 = row[1]['NO2 (µg/m3)'],
                        so_ugm3 = row[1]['SO (µg/m3)'],
                        o_ugm3 = row[1]['O (µg/m3)'],
                        pm10_ugm3 = row[1]['PM10 (µg/m3)'],
                        pm25_ugm3 = row[1]['PM2.5 (µg/m3)'],
                        day = row[1]['Date']
                    )

                    session.add(object)
                    session.commit()


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
server = APIServer()
app = server.app
