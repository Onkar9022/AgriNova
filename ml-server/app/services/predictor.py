"""
AgriNova Predictor Service
Loads XGBoost models and runs crop/fertilizer inference.
"""

import os
import joblib
import numpy as np
import difflib
from typing import Optional
from app.schemas.soil_input import (
    CropPredictionInput, CropPredictionOutput,
    FertilizerPredictionInput, FertilizerPredictionOutput,
    FertilizerScheduleItem, IrrigationScheduleItem, ExplanationReason,
    NutrientStatus, PHStatus, Season, SoilType,
)
from app.services.rule_engine import apply_rules
from app.services.preprocessor import validate_reading, preprocess_crop_input

# Global model references
_crop_model = None
_fertilizer_model = None
_crop_encoder = None
_crop_scaler = None
_fert_encoder = None
_fert_soil_encoder = None
_fert_crop_encoder = None
_fert_scaler = None

# Feature order for SHAP explainer (must match training column order - Kaggle 7.0 map)
FEATURE_ORDER = [
    "nitrogen", "phosphorus", "potassium", "air_temperature",
    "air_humidity", "ph", "rainfall"
]

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.65"))
BASE_DIR = os.getenv("MODEL_DIR", "app/models")

def load_models():
    """Load all ML models at server startup."""
    global _crop_model, _fertilizer_model, _crop_encoder, _crop_scaler
    global _fert_encoder, _fert_soil_encoder, _fert_crop_encoder, _fert_scaler

    files = {
        "_crop_model": "crop_model.pkl",
        "_crop_encoder": "crop_encoder.pkl",
        "_crop_scaler": "crop_scaler.pkl",
        "_fertilizer_model": "fertilizer_model.pkl",
        "_fert_encoder": "fertilizer_encoder.pkl",
        "_fert_soil_encoder": "fert_soil_encoder.pkl",
        "_fert_crop_encoder": "fert_crop_encoder.pkl",
        "_fert_scaler": "fert_scaler.pkl",
    }

    print("\nLoading models...")
    for var, filename in files.items():
        path = os.path.join(BASE_DIR, filename)
        if os.path.exists(path):
            globals()[var] = joblib.load(path)
            print(f"  ✅ Loaded: {filename}")
        else:
            print(f"  ⚠️  Missing: {filename} — API routes relying on this will fallback.")

# Load models synchronously on module import
load_models()

def models_loaded() -> bool:
    """Check if models are loaded."""
    return _crop_model is not None


def _classify_ph(ph: float) -> PHStatus:
    if ph < 6.5:
        return PHStatus.ACIDIC
    elif ph > 7.5:
        return PHStatus.ALKALINE
    return PHStatus.NEUTRAL


def _classify_nutrient(value: float, thresholds: tuple = (50, 100)) -> NutrientStatus:
    low, high = thresholds
    if value < low:
        return NutrientStatus.LOW
    elif value > high:
        return NutrientStatus.HIGH
    return NutrientStatus.MEDIUM


# Crop thresholds for explainability (optimal ranges)
CROP_THRESHOLDS = {
    "rice": {"ph": (6.0, 7.0), "n": (80, 140), "rainfall": (1100, 2000), "season": ["KHARIF"]},
    "wheat": {"ph": (6.0, 7.5), "n": (60, 120), "rainfall": (400, 800), "season": ["RABI"]},
    "maize": {"ph": (5.5, 7.0), "n": (60, 120), "rainfall": (600, 1200), "season": ["KHARIF", "RABI"]},
    "cotton": {"ph": (6.0, 8.0), "n": (40, 80), "rainfall": (500, 1000), "season": ["KHARIF"]},
    "sugarcane": {"ph": (6.0, 7.5), "n": (100, 200), "rainfall": (1000, 2000), "season": ["KHARIF"]},
    "soybean": {"ph": (6.0, 7.0), "n": (20, 60), "rainfall": (600, 1000), "season": ["KHARIF"]},
    "jowar": {"ph": (6.0, 8.0), "n": (30, 80), "rainfall": (300, 700), "season": ["KHARIF", "RABI"]},
    "bajra": {"ph": (6.0, 7.5), "n": (20, 60), "rainfall": (200, 500), "season": ["KHARIF"]},
    "chickpea": {"ph": (6.0, 8.0), "n": (20, 40), "rainfall": (300, 600), "season": ["RABI"]},
    "banana": {"ph": (6.0, 7.5), "n": (100, 200), "rainfall": (1000, 2000), "season": ["KHARIF"]},
    "mango": {"ph": (5.5, 7.5), "n": (50, 100), "rainfall": (750, 2500), "season": ["KHARIF"]},
    "coffee": {"ph": (4.5, 6.0), "n": (100, 200), "rainfall": (1500, 3000), "season": ["KHARIF"]},
    "coconut": {"ph": (5.5, 7.5), "n": (50, 120), "rainfall": (1000, 3000), "season": ["KHARIF"]},
    "jute": {"ph": (6.0, 7.5), "n": (60, 100), "rainfall": (1200, 2500), "season": ["KHARIF"]},
    "apple": {"ph": (5.5, 6.5), "n": (40, 100), "rainfall": (1000, 1500), "season": ["RABI"]},
    "orange": {"ph": (5.5, 7.0), "n": (60, 120), "rainfall": (600, 1500), "season": ["KHARIF"]},
    "papaya": {"ph": (6.0, 7.0), "n": (80, 150), "rainfall": (1000, 2000), "season": ["KHARIF"]},
    "watermelon": {"ph": (6.0, 7.0), "n": (50, 100), "rainfall": (400, 800), "season": ["ZAID"]},
    "grapes": {"ph": (6.0, 7.5), "n": (50, 100), "rainfall": (500, 1000), "season": ["RABI"]},
    "pomegranate": {"ph": (6.5, 7.5), "n": (40, 80), "rainfall": (500, 800), "season": ["KHARIF"]},
    "lentil": {"ph": (6.0, 8.0), "n": (20, 40), "rainfall": (300, 500), "season": ["RABI"]},
    "moong": {"ph": (6.5, 7.5), "n": (15, 40), "rainfall": (300, 600), "season": ["KHARIF", "ZAID"]},
}


def _generate_explanations(crop: str, input_data: CropPredictionInput) -> list[ExplanationReason]:
    """Generate human-readable explanations for why a crop was recommended."""
    reasons = []
    crop_lower = crop.lower()
    thresholds = CROP_THRESHOLDS.get(crop_lower)

    if not thresholds:
        return reasons

    # pH check
    ph_range = thresholds.get("ph", (6.0, 7.5))
    if ph_range[0] <= input_data.ph <= ph_range[1]:
        reasons.append(ExplanationReason(
            icon="✓",
            title="Optimal pH Balance",
            description=f"Your soil pH of {input_data.ph} matches the {ph_range[0]}–{ph_range[1]} preference for high-yield {crop} varieties."
        ))

    # Nitrogen check
    n_range = thresholds.get("n", (40, 120))
    if input_data.n >= n_range[0]:
        reasons.append(ExplanationReason(
            icon="✓",
            title="Nitrogen Surplus" if input_data.n > n_range[1] else "Adequate Nitrogen",
            description=f"Current Nitrogen levels (N={input_data.n:.0f}) are {'high enough' if input_data.n <= n_range[1] else 'surplus'} to support early vegetative growth without heavy initial fertilization."
        ))

    # Rainfall check
    rain_range = thresholds.get("rainfall", (400, 1500))
    if rain_range[0] <= input_data.rainfall <= rain_range[1]:
        reasons.append(ExplanationReason(
            icon="✓",
            title="Rainfall Match",
            description=f"Rainfall {input_data.rainfall:.0f}mm matches {crop} requirement ({rain_range[0]}–{rain_range[1]}mm)."
        ))

    # Season check
    season_list = thresholds.get("season", [])
    if input_data.season.value in season_list:
        reasons.append(ExplanationReason(
            icon="✓",
            title=f"Season is {input_data.season.value.title()}",
            description=f"{input_data.season.value.title()} is the peak growing season for {crop}."
        ))

    # EC / drainage note
    if input_data.ec < 2000:
        reasons.append(ExplanationReason(
            icon="ℹ",
            title="Drainage Note",
            description=f"EC of {input_data.ec:.0f} µS/cm indicates non-saline soil — suitable for {crop} cultivation."
        ))

    return reasons


# Fallback crop recommendation when no model is loaded
FALLBACK_CROPS = {
    "KHARIF": [("Rice", 0.85), ("Maize", 0.72), ("Cotton", 0.65)],
    "RABI": [("Wheat", 0.88), ("Chickpea", 0.75), ("Lentil", 0.68)],
    "ZAID": [("Watermelon", 0.80), ("Moong", 0.72), ("Sunflower", 0.65)],
}


def predict_crop(input_data: CropPredictionInput) -> CropPredictionOutput:
    """Run crop recommendation prediction."""

    # Data quality validation
    quality_status, warnings = validate_reading(input_data)

    # Classify nutrients and pH
    ph_status = _classify_ph(input_data.ph)
    n_status = _classify_nutrient(input_data.n, (40, 100))
    p_status = _classify_nutrient(input_data.p, (20, 60))
    k_status = _classify_nutrient(input_data.k, (20, 60))

    if _crop_model is not None and _crop_encoder is not None and _crop_scaler is not None:
        # Real model inference
        features = preprocess_crop_input(input_data, _crop_scaler)
        probabilities = _crop_model.predict_proba(features)[0]
        top_indices = np.argsort(probabilities)[::-1][:3]

        crops = _crop_encoder.inverse_transform(top_indices)
        confidences = probabilities[top_indices]

        top_crop = str(crops[0])
        confidence = float(confidences[0])
        rank_2 = str(crops[1])
        rank_2_conf = float(confidences[1])
        rank_3 = str(crops[2])
        rank_3_conf = float(confidences[2])
    else:
        # Fallback mode — rule-based recommendation
        season_crops = FALLBACK_CROPS.get(input_data.season.value, FALLBACK_CROPS["KHARIF"])

        # Adjust based on soil conditions
        adjusted = []
        for crop_name, base_conf in season_crops:
            adj = base_conf
            # pH adjustment
            crop_lower = crop_name.lower()
            if crop_lower in CROP_THRESHOLDS:
                ph_range = CROP_THRESHOLDS[crop_lower].get("ph", (6.0, 7.5))
                if ph_range[0] <= input_data.ph <= ph_range[1]:
                    adj += 0.05
                else:
                    adj -= 0.15
            adjusted.append((crop_name, min(adj, 0.99)))

        adjusted.sort(key=lambda x: x[1], reverse=True)
        top_crop, confidence = adjusted[0]
        rank_2, rank_2_conf = adjusted[1]
        rank_3, rank_3_conf = adjusted[2]

    # Apply rule engine post-processing
    top_crop, rank_2, rank_3, rule_overrides = apply_rules(
        top_crop, rank_2, rank_3, input_data
    )

    low_confidence = confidence < CONFIDENCE_THRESHOLD

    # Generate explanations
    explanations = _generate_explanations(top_crop, input_data)

    # Append rule engine overrides to explanations
    for override in rule_overrides:
        explanations.append(ExplanationReason(
            icon="⚠️",
            title="Rule Engine Override",
            description=override
        ))

    return CropPredictionOutput(
        top_crop=top_crop,
        confidence=round(confidence * 100, 1),
        rank_2=rank_2,
        rank_2_confidence=round(rank_2_conf * 100, 1),
        rank_3=rank_3,
        rank_3_confidence=round(rank_3_conf * 100, 1),
        low_confidence=low_confidence,
        ph_status=ph_status,
        n_status=n_status,
        p_status=p_status,
        k_status=k_status,
        explanation_reasons=explanations,
        data_quality_status=quality_status,
        data_quality_warnings=warnings,
    )


# Fallback fertilizer recommendations
FALLBACK_FERTILIZERS = {
    "rice": ("Urea 46-0-0", 125),
    "wheat": ("DAP 18-46-0", 100),
    "maize": ("NPK 20-20-0", 110),
    "cotton": ("NPK 10-26-26", 90),
    "sugarcane": ("Urea 46-0-0", 200),
    "soybean": ("SSP 0-16-0", 80),
    "jowar": ("DAP 18-46-0", 75),
    "bajra": ("Urea 46-0-0", 60),
    "chickpea": ("SSP 0-16-0", 50),
    "banana": ("NPK 19-19-19", 150),
    "default": ("NPK 10-26-26", 100),
}


def _generate_irrigation_schedule(soil_type: SoilType, moisture: float, rainfall_mm: float, crop_name: str) -> list[IrrigationScheduleItem]:
    """Generates an adaptive water cycle timeline based on soil retention and recent rainfall."""
    
    # Base configuration assumptions
    base_interval = 7
    volume = 20000.0 # Standard liters per acre for average crops
    
    # Modulate Interval on Soil Type (Retention vs Drainage)
    if soil_type == SoilType.SANDY:
        base_interval = 3
        volume *= 0.6  # less water at a time, more often
    elif soil_type == SoilType.BLACK_COTTON:
        base_interval = 12
        volume *= 1.4  # holds heavy water without drainage loss
    elif soil_type == SoilType.RED:
        base_interval = 5
        volume *= 0.8
        
    # Crop Specific Volume Adjustments
    crop_lower = crop_name.lower()
    if crop_lower in ["rice", "sugarcane", "banana"]:
        base_interval -= 2
        volume *= 1.5
    elif crop_lower in ["bajra", "jowar", "cotton"]:
        base_interval += 4
        volume *= 0.7
        
    # Floor safety
    base_interval = max(2, base_interval)
    
    # Phase calculations mapping
    schedule = []
    
    # Current Phase (Adaptive via live moisture)
    is_saturated = moisture > 80.0
    rain_blocking = rainfall_mm > 15.0 # if >15mm rain hit, suspend natural irrigation
    
    schedule.append(IrrigationScheduleItem(
        phase="CURRENT",
        action_title="Immediate Top-Up Cycle",
        days_interval=base_interval if not (is_saturated or rain_blocking) else base_interval + 5,
        water_volume_liters_per_acre=round(volume if moisture < 40.0 else volume * 0.5, 0),
        purpose="Reacting to current soil moisture depletion." if not rain_blocking else "Sufficient recent rainfall detected. Soil is adequately saturated.",
        weather_suspended=is_saturated or rain_blocking
    ))
    
    # Future Phase Maintenance Blueprint
    schedule.append(IrrigationScheduleItem(
        phase="VEGETATIVE MAINTENANCE",
        action_title="Standard Cycle",
        days_interval=base_interval,
        water_volume_liters_per_acre=round(volume, 0),
        purpose="Sustaining canopy expansion rate.",
        weather_suspended=False
    ))
    
    return schedule


def predict_fertilizer(input_data: FertilizerPredictionInput) -> FertilizerPredictionOutput:
    """Run fertilizer recommendation prediction."""

    raw_crop_key = input_data.crop_name.lower().strip()
    
    # 1. Spelling Corrector
    # Check if raw text matches any known crops
    known_crops = list(CROP_THRESHOLDS.keys()) + list(FALLBACK_FERTILIZERS.keys())
    matches = difflib.get_close_matches(raw_crop_key, known_crops, n=1, cutoff=0.6)
    
    crop_key = matches[0] if matches else raw_crop_key
    auto_corrected_name = crop_key.title()

    fert_name, base_dose = FALLBACK_FERTILIZERS.get(
        crop_key, FALLBACK_FERTILIZERS["default"]
    )

    if _fertilizer_model is not None and _fert_scaler is not None and _fert_encoder is not None:
        try:
            # Reconstruct crop prediction specifically for fertilizer ML
            # Temperature, Humidity, Moisture, Soil Type, Crop Type, Nitrogen, Potassium, Phosphorous
            
            # 1. First get predicted crop from crop component if available
            predicted_crop = 0 # Default fallback
            if _crop_model is not None:
                ph_median = 6.42 # typical median from dataset if missing
                rainfall_median = 104.6 # typical median from dataset if missing

                c_features = np.array([[
                    input_data.n,
                    input_data.p,
                    input_data.k,
                    input_data.temperature,
                    input_data.humidity,
                    ph_median,
                    rainfall_median
                ]])
                c_scaled = _crop_scaler.transform(c_features)
                predicted_crop = _crop_model.predict(c_scaled)[0]
            
            # Handle encoding with safety fallback
            soil_enc_val = 0
            if _fert_soil_encoder and str(input_data.soil_type.value) in _fert_soil_encoder.classes_:
                soil_enc_val = _fert_soil_encoder.transform([str(input_data.soil_type.value)])[0]
                
            crop_enc_val = 0
            if _fert_crop_encoder and auto_corrected_name in _fert_crop_encoder.classes_:
                crop_enc_val = _fert_crop_encoder.transform([auto_corrected_name])[0]
            elif _fert_crop_encoder and "Rice" in _fert_crop_encoder.classes_:
                 # Final fallback to avoid crash
                 crop_enc_val = _fert_crop_encoder.transform(["Rice"])[0]
            
            # Predict Fertilizer
            # Input: {Temperature, Humidity, Moisture, Soil Type, Crop Type, N, P, K, predicted_crop}
            f_features = np.array([[
                input_data.temperature,
                input_data.humidity,
                input_data.moisture,
                soil_enc_val,
                crop_enc_val,
                input_data.n,
                input_data.k,
                input_data.p,
                predicted_crop
            ]])
            
            f_scaled = _fert_scaler.transform(f_features)
            pred_idx = _fertilizer_model.predict(f_scaled)[0]
            fert_name = str(_fert_encoder.inverse_transform([pred_idx])[0])

        except Exception as e:
            print(f"Error in fertilizer ML inference: {e}, falling back.")
            pass

    dose_per_acre = base_dose
    total_dose = dose_per_acre * input_data.land_area_acres

    # Build application schedule (Basal + Top Dressing)
    schedule = [
        FertilizerScheduleItem(
            phase="PHASE 01",
            name="Basal Dose",
            dose_kg=round(dose_per_acre * 0.5, 1),
            percentage=50,
            timing="At sowing",
            purpose="Root establishment, early growth",
        ),
        FertilizerScheduleItem(
            phase="PHASE 02",
            name="1st Top Dressing",
            dose_kg=round(dose_per_acre * 0.3, 1),
            percentage=30,
            timing="At 30 days growth",
            purpose="Vegetative growth boost",
        ),
        FertilizerScheduleItem(
            phase="PHASE 03",
            name="2nd Top Dressing",
            dose_kg=round(dose_per_acre * 0.2, 1),
            percentage=20,
            timing="At flowering stage",
            purpose="Yield and grain fill support",
        ),
    ]

    # Generate an advanced Health Roadmap Note
    optimal_range = CROP_THRESHOLDS.get(crop_key, {"ph": (6.0, 7.5), "n": (60, 100)})
    ph_min, ph_max = optimal_range.get("ph", (6.0, 7.5))
    n_min, n_max = optimal_range.get("n", (40, 100))
    
    roadmap_note = (
        f"**HEALTH BOOST ROADMAP FOR {auto_corrected_name.upper()}**\n\n"
        f"1. **Maintenance Protocol**: To guarantee rapid and effective growth, maintain the soil pH between {ph_min} and {ph_max}.\n"
        f"2. **NPK Targets**: Ensure Nitrogen levels stay within {n_min}—{n_max} mg/kg during the vegetative phase. "
        f"Excess N will cause lodging, while a deficit will stunt early root architecture.\n"
        f"3. **Application Rule**: Apply {fert_name} strictly according to the divided Phase Schedule. "
        f"Do NOT apply top dressing if heavy rainfall is expected within 24 hours to prevent runoff.\n"
        f"4. **AI Anomaly Check**: We automatically corrected input spelling to standard '{auto_corrected_name}' context constraints."
    )

    # Process Adaptive Irrigation Timeline
    dynamic_irrigation = _generate_irrigation_schedule(
        soil_type=input_data.soil_type,
        moisture=input_data.moisture,
        rainfall_mm=input_data.rainfall,
        crop_name=auto_corrected_name
    )

    return FertilizerPredictionOutput(
        fertilizer_name=fert_name,
        total_dose_kg=round(total_dose, 1),
        dose_per_acre=round(dose_per_acre, 1),
        application_schedule=schedule,
        irrigation_schedule=dynamic_irrigation,
        notes=roadmap_note,
    )

# Public aliases for shap_explainer.py
def get_crop_model():     return _crop_model
def get_crop_scaler():    return _crop_scaler
def get_crop_encoder():   return _crop_encoder
