from unittest import result
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends
from pydantic import BaseModel
import logging
import math
from Server import APIServer
from stations import townsCoordinates



logger = logging.getLogger('uvicorn.error')

client = TestClient(APIServer(dbprocessor=False))

# Town Coordinates

townsCoordinates = {


    # # Station Coordinate
    "Msida" : [35.895583, 14.493210],
    "Gharb" : [36.061415, 14.209355],
    "Zejtun" : [35.854997, 14.543076],
    "Attard" : [35.890355, 14.433565],
    "St. Paul's Bay" : [35.947516, 14.394565],

    "Munxar": [36.0294, 14.2522],
    "Rabat": [35.8815, 14.3987],
    "Mdina": [35.8866, 14.4036],
    "Xewkija": [36.032564, 14.256916]
}


# Fake Database

fake_db_averages = {
    "Attard" : {"SO2": 0, "NO2": 11.3, "PM25": 11.23, "PM10": 0, "O3": 73.99},
    "Msida": {"SO2": 0.57, "NO2": 27.72, "PM25": 13.67, "PM10": 43.08, "O3": 0}
}

fake_db_stations =  {
        "Attard": {"PM25": 13.8, "PM10": 0, "O3": 44.85, "SO2": 0, "NO2": 13.15},
        "Msida" : {"PM25": 17, "PM10": 39.3, "O3": 0, "SO2": 1.04, "NO2": 29.96},
        "Zejtun" : {"PM25": 14, "PM10": 28.9, "O3": 51.25, "SO2": 0.41, "NO2": 20.61},
        "St. Paul's Bay" : {"PM25": 13.8, "PM10": 0, "O3": 44.85, "SO2": 0, "NO2": 13.15},
        "Gharb" : {"PM25": 13.8, "PM10": 0, "O3": 44.85, "SO2": 0, "NO2": 13.15}
    }
# Needed Variables

WHOThresholds = {
    "SO2" : 40,
    "NO2" : 40,
    "PM10" : 15,
    "PM25" : 5,
    "CO2" : 4,
    "O3": 60
}


# Payload Models
class RiskTownPayload(BaseModel):
    town: str
    risks: object


app = FastAPI()

# Helper methods for testing

def __compute_risk(RR, CFPol, Pol):
    '''Computes Relative Risk Increase relative to a counterfactual pollutant reading CF'''
    # Compute CRF

    logger.debug(f"Computing risk with RR: {RR}, CFPol: {CFPol}, Pol: {Pol}")
    
    if RR == 0:
        return 0
    
    CRF = math.log(RR) / 10
    result = round((math.exp(CRF * (Pol - CFPol))), 2)
    logger.debug(f"Computed risk: {result} for RR: {RR}, CFPol: {CFPol}, Pol: {Pol}")

    return result


@app.post("/getDiseaseRisks")
def get_disease_risks(payload: RiskTownPayload):
    ''' Will Retrieve the towns Relative Risk based on NO2, PM2.5 & PM10 readings.'''

    town = payload.town
    risks = payload.risks

    logger.debug(f"Received payload for disease risks: {payload.risks}")

    # Get Average NO2, PM10 and PM2.5 readings for the town

    result = fake_db_averages[town]

    map = {
        "SO2" : result["SO2"],
        "NO2" : result["NO2"],
        "PM10" : result["PM10"],
        "PM25" : result["PM25"],
        "O3" : result["O3"]
    }

    contents = {}

    for key in risks.keys():
        tempRisks = {"SO2" : 0, "NO2" : 0, "PM10" : 0, "PM25" : 0, "O3" : 0}
        for pol in ["SO2", "NO2", "PM10", "PM25", "O3"]:
            
            logger.debug(f"Processing disease: {key} for pollutant {pol}")
            result = __compute_risk(risks[key][pol], WHOThresholds[pol], map[pol])
            tempRisks[pol] = result
            logger.debug(f"Computed risk for disease {key} and pollutant {pol}: {result}")
        
        logger.debug(f"Computed risks for disease {key}: {tempRisks}")
        contents[key] = tempRisks

    logger.debug(f"Computed disease risks: {contents}")
    return contents
    



    






