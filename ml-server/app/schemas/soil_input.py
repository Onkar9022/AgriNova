"""
Pydantic schemas for ML server input/output validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class SoilType(str, Enum):
    BLACK_COTTON = "BLACK_COTTON"
    RED = "RED"
    ALLUVIAL = "ALLUVIAL"
    LATERITE = "LATERITE"
    SANDY = "SANDY"


class Season(str, Enum):
    KHARIF = "KHARIF"
    RABI = "RABI"
    ZAID = "ZAID"


class CropPredictionInput(BaseModel):
    """Input schema for crop recommendation prediction."""
    n: float = Field(..., ge=0, le=1999, description="Nitrogen (mg/kg)")
    p: float = Field(..., ge=0, le=1999, description="Phosphorus (mg/kg)")
    k: float = Field(..., ge=0, le=1999, description="Potassium (mg/kg)")
    ph: float = Field(..., ge=0, le=14, description="Soil pH")
    moisture: float = Field(..., ge=0, le=100, description="Soil moisture (%)")
    soil_temp: float = Field(..., ge=-40, le=80, description="Soil temperature (°C)")
    ec: float = Field(..., ge=0, le=10000, description="Electrical conductivity (µS/cm)")
    rainfall: float = Field(..., ge=0, description="Annual rainfall (mm)")
    air_temp: float = Field(..., ge=-50, le=60, description="Air temperature (°C)")
    humidity: float = Field(..., ge=0, le=100, description="Air humidity (%)")
    season: Season = Field(..., description="Current growing season")
    soil_type: SoilType = Field(..., description="Soil classification")


class NutrientStatus(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class PHStatus(str, Enum):
    ACIDIC = "ACIDIC"
    NEUTRAL = "NEUTRAL"
    ALKALINE = "ALKALINE"


class ExplanationReason(BaseModel):
    """A single explanation reason for crop recommendation."""
    icon: str = Field(..., description="✓ or ⚠ or ℹ")
    title: str
    description: str


class CropPredictionOutput(BaseModel):
    """Output schema for crop recommendation."""
    top_crop: str
    confidence: float
    rank_2: str
    rank_2_confidence: float
    rank_3: str
    rank_3_confidence: float
    low_confidence: bool = False
    ph_status: PHStatus
    n_status: NutrientStatus
    p_status: NutrientStatus
    k_status: NutrientStatus
    explanation_reasons: list[ExplanationReason] = []
    data_quality_status: str = "VALID"
    data_quality_warnings: list[str] = []


class FertilizerPredictionInput(BaseModel):
    """Input schema for fertilizer recommendation."""
    crop_name: str = Field(..., description="Crop to fertilize")
    n: float = Field(..., ge=0, le=1999)
    p: float = Field(..., ge=0, le=1999)
    k: float = Field(..., ge=0, le=1999)
    soil_type: SoilType
    moisture: float = Field(..., ge=0, le=100)
    temperature: float = Field(..., description="Air temperature (°C)")
    humidity: float = Field(..., description="Air humidity (%)")
    rainfall: float = Field(0.0, description="Recent/Current Rainfall (mm)")
    growth_stage: Optional[str] = None
    land_area_acres: float = Field(..., gt=0)


class FertilizerScheduleItem(BaseModel):
    """A single fertilizer application phase."""
    phase: str
    name: str
    dose_kg: float
    percentage: int
    timing: str
    purpose: str
    date_range: Optional[str] = None


class IrrigationScheduleItem(BaseModel):
    """A single responsive irrigation water cycle item."""
    phase: str
    action_title: str
    days_interval: int
    water_volume_liters_per_acre: float
    purpose: str
    weather_suspended: bool = False


class FertilizerPredictionOutput(BaseModel):
    """Output schema for fertilizer recommendation."""
    fertilizer_name: str
    total_dose_kg: float
    dose_per_acre: float
    application_schedule: list[FertilizerScheduleItem]
    irrigation_schedule: list[IrrigationScheduleItem] = []
    notes: str = ""
