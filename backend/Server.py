from fastapi import FastAPI, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated, Literal
from pydantic import BaseModel, Field
from datetime import date
import logging
from sqlmodel import Field, Session, SQLModel, create_engine, select
from contextlib import asynccontextmanager

class PollutantFilterParams(BaseModel):
    nO : bool
    sO2: bool
    o3: bool
    pM2: bool
    pM10: bool
    nO2: bool

class Pollutants(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    town: str | None = Field(default=None)
    no_ugm3: float | None = Field(default=None)
    no2_ugm3: float | None = Field(default=None)
    so_ugm3: float | None = Field(default=None)
    o_ugm3: float | None = Field(default=None)
    pm10_ugm3: float | None = Field(default=None)
    pm25_ugm3: float | None = Field(default=None)
    day: date | None = Field(default=None)



db_url = "mysql+pymysql://root:TriCeption123@localhost:3306/fydb"

engine = create_engine(db_url, echo=True)


def get_session():
    with Session(engine) as session:
        yield session
        
SessionDep = Annotated[Session, Depends(get_session)]


# Establishes a connection between the DB and backend server
def check_db_connection():
    with Session(engine) as session:
        try:
            session.exec(select(Pollutants)).first()
            return {"status": "ok", "message": "Database connected"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

# Sets up the necessary models for the ORM
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    print("Models established.")

# Startup configuration
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Establishing models.", flush=True)
    create_db_and_tables()
    print("Checking DB connection.", flush=True)
    print(check_db_connection())
    yield

app = FastAPI(lifespan=lifespan)
 
# Defined origins for CORS
origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

 
# Retrieves Pollution volume of a specific entry.
@app.get("/getTown/{id}")
async def test_getTown(id: int, session:SessionDep):
    pollutant = session.get(Pollutants, id)
    if not pollutant:
        return {"Erorr" : "Trouble retrieving pollutant data"}
    return pollutant

@app.get("/getPollutantVol/")
async def pollutant_endpoint(session: SessionDep, start_date: date = None, end_date: date = date.now().replace(day=1)):
    result = select(Pollutants).filter(Pollutants.day >= start_date)

    if end_date:
        results = results.filter(Pollutants.day <= end_date)

    if not result:
        return {"Error" : "No results found."}
    return result


@app.get("/getPollutantVolTown/")
async def pollutant_endpoint_town(town: str, session: SessionDep, start_date: date = date.now(), end_date: date = date.now().replace(day=1)):

    result = select(Pollutants).where(Pollutants.town == town).filter(Pollutants.day >= start_date)

    if end_date:
        result = result.filter(Pollutants.day <= end_date)

    if not result:
        return {"Error" : "No results found"}
    return result

@app.post("/getPollutants")
async def pollutant_endpoint(query: PollutantFilterParams, session: SessionDep):
    result = select(Pollutants)

async def diseases_endpoint(query: PollutantFilterParams):
    # return {"nO" : query.nO, "sO" : query.sO, "o3": query.o3, "pM2" : query.pM2, "pM10" : query.pM10, "nO2" : query.nO2}
    return query

