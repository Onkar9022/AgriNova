from fastapi import APIRouter
from app.services.predictor import _crop_model, _crop_encoder, _crop_scaler, models_loaded

router = APIRouter()

@router.get("/health")
async def health_check():
    return {
        "status": "ok" if models_loaded() else "degraded",
        "model_loaded": _crop_model is not None,
        "encoder_loaded": _crop_encoder is not None,
        "scaler_loaded": _crop_scaler is not None,
    }
