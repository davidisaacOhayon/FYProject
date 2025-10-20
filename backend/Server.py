from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Annotated, Literal
from pydantic import BaseModel, Field


app = FastAPI()

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

class PollutantFilterParams(BaseModel):
    nO : bool
    sO2: bool
    o3: bool
    pM2: bool
    pM10: bool
    nO2: bool





@app.get("/Test/{someVariable}")
async def test_Endpoint(someVariable: str):
    return({"message":f"Passed variable: {someVariable}"})


@app.post("/getPollutantVol/")
async def pollutant_endpoint(query: PollutantFilterParams ):
    return query    

async def diseases_endpoint(query: PollutantFilterParams):
    # return {"nO" : query.nO, "sO" : query.sO, "o3": query.o3, "pM2" : query.pM2, "pM10" : query.pM10, "nO2" : query.nO2}
    return query

