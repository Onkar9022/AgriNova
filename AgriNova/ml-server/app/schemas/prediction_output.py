from pydantic import BaseModel
from typing import List, Optional


class SHAPFactor(BaseModel):
    feature:      str
    display_name: str
    value:        str          # human-readable e.g. "7.2" or "120 mg/kg"
    shap_value:   float        # raw SHAP value
    abs_shap:     float
    direction:    str          # "positive" or "negative"
    strength:     str          # "strong", "moderate", "weak"
    explanation:  str          # plain-English sentence


class SHAPResult(BaseModel):
    crop:       str
    base_value: float
    factors:    List[SHAPFactor]


class CropPredictionResponse(BaseModel):
    # Core prediction
    top_crop:           str
    confidence:         float          # 0–100
    rank_2:             str
    rank_2_confidence:  float
    rank_3:             str
    rank_3_confidence:  float
    low_confidence:     bool

    # Soil health classification
    ph_status:          str            # strongly_acidic / slightly_acidic / neutral / slightly_alkaline / strongly_alkaline
    n_status:           str            # very_low / low / medium / high / very_high
    p_status:           str
    k_status:           str
    ec_status:          str            # normal / high_salinity / very_high_salinity

    # SHAP explanation (always included)
    explanation:        SHAPResult


class SoilInputSchema(BaseModel):
    nitrogen:         float
    phosphorus:       float
    potassium:        float
    ph:               float
    moisture:         float
    soil_temperature: float
    ec:               float
    rainfall:         float
    air_temperature:  float
    air_humidity:     float
    season_code:      int      # 0=kharif, 1=rabi, 2=zaid
    soil_type_code:   int      # 0=black_cotton, 1=red, 2=alluvial, 3=laterite, 4=sandy
