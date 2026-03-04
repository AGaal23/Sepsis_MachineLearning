import logging
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
from model.model import predict, MODEL_VERSION, feature_names

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sepsis Prediction API",
    description="API for predicting sepsis risk based on patient data",
    version=MODEL_VERSION
)

# Allow requests from the React dev server and any other origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Input
# All fields match the feature names in the model
class PatientFeatures(BaseModel):
    HR: Optional[float] = None
    O2Sat: Optional[float] = None
    Temp: Optional[float] = None
    SBP: Optional[float] = None
    MAP: Optional[float] = None
    DBP: Optional[float] = None
    Resp: Optional[float] = None
    Age: Optional[float] = None
    Gender: Optional[float] = None
    ICULOS: Optional[float] = None

# Routes 
@app.get("/")
def root():
    return {"message": "Sepsis Prediction API is running", "model_version": MODEL_VERSION}

@app.get("/features")
def get_features():
    # Returns what features the model expects when connecting the device later in order.
    return {"features": feature_names}

@app.post("/predict")
def make_prediction(patient: PatientFeatures):
    try:
        result = predict(patient.model_dump())
        logger.info(f"Request processed | result={result}")
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)