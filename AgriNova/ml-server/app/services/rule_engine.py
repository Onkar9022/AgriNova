"""
Rule Engine — Hybrid ML + Rules post-processing.
Enforces agronomic constraints that the ML model cannot learn from training data alone.
"""

from app.schemas.soil_input import CropPredictionInput, SoilType


# Crops that need heavy water
WATER_HEAVY_CROPS = {"rice", "banana", "sugarcane"}

# Drought-tolerant crops
DROUGHT_TOLERANT = {"jowar", "bajra", "moong", "cotton", "soybean"}

# Salt-tolerant crops
SALT_TOLERANT = {"barley", "cotton", "bajra"}

# Fallback replacements when a crop is removed
REPLACEMENT_CROPS = ["Jowar", "Bajra", "Moong", "Cotton", "Soybean", "Chickpea", "Wheat"]


def _find_replacement(excluded: set, current_crops: list) -> str:
    """Find a replacement crop that isn't already in the top 3."""
    current_lower = {c.lower() for c in current_crops}
    for crop in REPLACEMENT_CROPS:
        if crop.lower() not in excluded and crop.lower() not in current_lower:
            return crop
    return "Soybean"


def apply_rules(
    crop1: str, crop2: str, crop3: str,
    input_data: CropPredictionInput
) -> tuple[str, str, str, list[str]]:
    """
    Post-process ML predictions with agronomic rules.
    Returns adjusted (crop1, crop2, crop3) and a list of override reasons.
    """
    crops = [crop1, crop2, crop3]
    excluded = set()
    overrides = []

    # Rule 1: If rainfall < 300mm, remove water-heavy crops
    if input_data.rainfall < 300:
        for i, crop in enumerate(crops):
            if crop.lower() in WATER_HEAVY_CROPS:
                excluded.add(crop.lower())
                crops[i] = _find_replacement(excluded, crops)
                overrides.append(f"{crop.title()} was removed because recent rainfall ({input_data.rainfall}mm) is critically low (<300mm). Replaced with {crops[i].title()}.")

    # Rule 2: If soil is SANDY, remove water-heavy crops
    if input_data.soil_type == SoilType.SANDY:
        for i, crop in enumerate(crops):
            if crop.lower() in WATER_HEAVY_CROPS:
                excluded.add(crop.lower())
                crops[i] = _find_replacement(excluded, crops)
                overrides.append(f"{crop.title()} was removed because sandy soil drains too fast to support its high water demand. Replaced with {crops[i].title()}.")

    # Rule 3: If EC > 4000 µS/cm (saline), only salt-tolerant crops
    if input_data.ec > 4000:
        for i, crop in enumerate(crops):
            if crop.lower() not in SALT_TOLERANT:
                excluded.add(crop.lower())
                # Replace with salt-tolerant alternative
                for st_crop in ["Barley", "Cotton", "Bajra"]:
                    if st_crop.lower() not in {c.lower() for c in crops}:
                        crops[i] = st_crop
                        overrides.append(f"{crop.title()} was removed because your soil is highly saline (EC={input_data.ec} µS/cm). Replaced with salt-tolerant {st_crop.title()}.")
                        break

    # Rule 4: If pH < 5.0 (very acidic), only acid-tolerant crops
    if input_data.ph < 5.0:
        acid_tolerant = {"tea", "coffee", "potato", "rice", "banana"}
        for i, crop in enumerate(crops):
            if crop.lower() not in acid_tolerant:
                excluded.add(crop.lower())
                crops[i] = _find_replacement(excluded, crops)
                overrides.append(f"{crop.title()} was removed because your soil is too acidic (pH={input_data.ph} < 5.0). Replaced with acid-tolerant {crops[i].title()}.")

    return crops[0], crops[1], crops[2], overrides
