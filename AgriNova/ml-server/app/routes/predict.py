"""
Prediction routes for crop and fertilizer recommendation.
Rate-limited to 10 req/minute per client IP.
"""

from fastapi import APIRouter, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.schemas.soil_input import (
    CropPredictionInput, FertilizerPredictionInput, FertilizerPredictionOutput,
    Season, SoilType
)
from app.schemas.prediction_output import CropPredictionResponse
from app.services.predictor import predict_crop, predict_fertilizer

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/crop", response_model=CropPredictionResponse)
@limiter.limit("10/minute")
async def predict_crop_route(request: Request, input_data: CropPredictionInput):
    """
    Predict the best crop to plant based on soil parameters.
    Returns top 3 crops with confidence scores, soil health status,
    and explainability reasons using SHAP.
    """
    try:
        # Run original crop inference
        result_obj = predict_crop(input_data)
        
        # Convert to dictionary safely
        res_dict = result_obj.model_dump()
        
        # Ensure status Enums are formatted safely as strings mapping to the new schema
        res_dict["ph_status"] = str(res_dict.get("ph_status", "neutral")).replace("PHStatus.", "").lower()
        res_dict["n_status"] = str(res_dict.get("n_status", "medium")).replace("NutrientStatus.", "").lower()
        res_dict["p_status"] = str(res_dict.get("p_status", "medium")).replace("NutrientStatus.", "").lower()
        res_dict["k_status"] = str(res_dict.get("k_status", "medium")).replace("NutrientStatus.", "").lower()
        res_dict["ec_status"] = "normal"
        
        # Inject SHAP explanation!
        from app.services.shap_explainer import explain_prediction
        # We need the dictionary version of the input_data for SHAP explainer
        data_dict = input_data.model_dump()
        
        shap_input = {
            "nitrogen":         data_dict["n"],
            "phosphorus":       data_dict["p"],
            "potassium":        data_dict["k"],
            "air_temperature":  data_dict.get("temperature", 25.0),
            "air_humidity":     data_dict.get("humidity", 50.0),
            "ph":               data_dict["ph"],
            "rainfall":         data_dict["rainfall"],
        }
        try:
            res_dict["explanation"] = explain_prediction(shap_input, result_obj.top_crop)
        except Exception as e:
            print(f"SHAP explanation failed: {e}")
            res_dict["explanation"] = {"crop": result_obj.top_crop, "base_value": 0, "factors": []}
        
        return res_dict
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/fertilizer", response_model=FertilizerPredictionOutput)
@limiter.limit("10/minute")
async def predict_fertilizer_route(request: Request, input_data: FertilizerPredictionInput):
    """
    Predict the best fertilizer and dosage schedule for a given crop.
    Returns fertilizer name, dosage per acre, and 3-phase application schedule.
    """
    try:
        result = predict_fertilizer(input_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
