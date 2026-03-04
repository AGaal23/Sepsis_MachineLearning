import joblib
import pandas as pd
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

MODEL_VERSION = "1.0.0"

# Paths
MODEL_DIR = Path(__file__).parent
MODEL_PATH = MODEL_DIR / "sepsis_model.pkl"
FEATURE_NAMES_PATH = MODEL_DIR / "feature_names.pkl"

# load model and feature names at startup
logger.info(f"Loading model v{MODEL_VERSION} from {MODEL_PATH}")
model = joblib.load(MODEL_PATH)
feature_names = joblib.load(FEATURE_NAMES_PATH)
logger.info(f"Model loaded. Expected features: {feature_names}")

# Threshold for classification
def get_threshold() -> float:
    return 0.4

# Prediction
def predict(input_data: dict) -> dict:

    threshold = get_threshold()

    # Build a single-row DataFrame in the exact feature order the model expects
    row = {feat: input_data.get(feat, None) for feat in feature_names}
    df = pd.DataFrame([row])

    probability = model.predict_proba(df)[0][1]  # probability of Sepsis label (1)
    prediction = int(probability >= threshold)

    logger.info(
        f"Prediction made | version={MODEL_VERSION} | threshold={threshold} "
        f"| probability={probability:.4f} | label={prediction}"
    )

    return {
        "model_version": MODEL_VERSION,
        "threshold_used": threshold,
        "sepsis_probability": round(float(probability), 4),
        "prediction": prediction,          # 1 = Sepsis, 0 = No Sepsis
        "label": "Sepsis" if prediction == 1 else "No Sepsis"
    }