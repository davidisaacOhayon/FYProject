from unittest import result
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends
from pydantic import BaseModel
import logging
import math
from backend.Tests.MockServer import app


logger = logging.getLogger('uvicorn.error')


client = TestClient(app)

def test_data_pollutant_disease_risks():

    body = { 
    "COPD" : {  "SO2": 0, "NO2": 1.04, "PM25": 1.14, "PM10": 1.22, "O3": 0},
    "LUNGC" : { "SO2": 0, "NO2": 1.07, "PM25": 1.09, "PM10": 1.10, "O3": 0},
    "CVD" : { "SO2": 0, "NO2": 1.05, "PM25": 1.14, "PM10": 1.06, "O3": 0},
    "RES" : { "SO2": 0, "NO2": 1.05, "PM25": 1.14, "PM10": 1.12, "O3": 1.05},
    "IHD" : { "SO2": 0, "NO2": 1.05, "PM25": 1.14, "PM10": 1.06, "O3": 0}
  }
    response = client.post("/getDiseaseRisks/", json={"town" : "Attard", "risks" : body})
    response2 = client.post("/getDiseaseRisks/", json={"town" : "Msida", "risks" : body})
    
    assert response.status_code == 200
    assert response.json() == {'COPD': {'SO2': 0, 'NO2': 0.89, 'PM10': 0.74, 'PM25': 1.09, 'O3': 0}, 
                               'LUNGC': {'SO2': 0, 'NO2': 0.82, 'PM10': 0.87, 'PM25': 1.06, 'O3': 0}, 
                               'CVD': {'SO2': 0, 'NO2': 0.87, 'PM10': 0.92, 'PM25': 1.09, 'O3': 0}, 
             'RES': {'SO2': 0, 'NO2': 0.87, 'PM10': 0.84, 'PM25': 1.09, 'O3': 1.07}, 
             'IHD': {'SO2': 0, 'NO2': 0.87, 'PM10': 0.92, 'PM25': 1.09, 'O3': 0}}

    logger.debug(response2.json())
    assert response2.status_code == 200
    assert response2.json() == {'COPD': {'SO2': 0, 'NO2': 0.95, 'PM10': 1.75, 'PM25': 1.12, 'O3': 0}, 
                                'LUNGC': {'SO2': 0, 'NO2': 0.92, 'PM10': 1.31, 'PM25': 1.08, 'O3': 0}, 
                                'CVD': {'SO2': 0, 'NO2': 0.94, 'PM10': 1.18, 'PM25': 1.12, 'O3': 0}, 
             'RES': {'SO2': 0, 'NO2': 0.94, 'PM10': 1.37, 'PM25': 1.12, 'O3': 0.75}, 
             'IHD': {'SO2': 0, 'NO2': 0.94, 'PM10': 1.18, 'PM25': 1.12, 'O3': 0}}