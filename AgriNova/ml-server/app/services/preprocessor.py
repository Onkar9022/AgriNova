"""
Data quality validation and preprocessing for ML input.
"""

import numpy as np
from app.schemas.soil_input import CropPredictionInput, SoilType, Season


def validate_reading(input_data: CropPredictionInput) -> tuple[str, list[str]]:
    """
    Validate sensor reading data quality.
    Returns (status, list_of_warnings).
    Status: "VALID", "WARNING", "REJECTED"
    """
    warnings = []

    # pH range check
    if input_data.ph < 3.0 or input_data.ph > 10.0:
        warnings.append(f"pH value {input_data.ph} is outside normal range (3.0–10.0). Possible sensor error.")

    # NPK sanity check
    if input_data.n > 500:
        warnings.append(f"Nitrogen {input_data.n} mg/kg is unusually high. Please verify.")
    if input_data.p > 500:
        warnings.append(f"Phosphorus {input_data.p} mg/kg is unusually high. Please verify.")
    if input_data.k > 500:
        warnings.append(f"Potassium {input_data.k} mg/kg is unusually high. Please verify.")

    # EC anomaly
    if input_data.ec > 4000:
        warnings.append(f"EC {input_data.ec} µS/cm indicates high salinity. Limited crops viable.")

    # Moisture check
    if input_data.moisture > 90:
        warnings.append(f"Soil moisture {input_data.moisture}% is extremely high. Check for waterlogging.")

    if len(warnings) > 2:
        return "REJECTED", warnings
    elif len(warnings) > 0:
        return "WARNING", warnings
    return "VALID", warnings


# Soil type encoding order — must match training
SOIL_TYPE_ENCODING = {
    SoilType.BLACK_COTTON: 0,
    SoilType.RED: 1,
    SoilType.ALLUVIAL: 2,
    SoilType.LATERITE: 3,
    SoilType.SANDY: 4,
}

SEASON_ENCODING = {
    Season.KHARIF: 0,
    Season.RABI: 1,
    Season.ZAID: 2,
}


def preprocess_crop_input(input_data: CropPredictionInput, scaler=None) -> np.ndarray:
    """
    Convert CropPredictionInput to numpy feature array for XGBoost.
    Feature order: [N, P, K, temperature, humidity, ph, rainfall]
    """
    features = np.array([[
        input_data.n,
        input_data.p,
        input_data.k,
        input_data.air_temp,
        input_data.humidity,
        input_data.ph,
        input_data.rainfall,
    ]])

    if scaler is not None:
        features = scaler.transform(features)

    return features
