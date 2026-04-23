import shap
import numpy as np
import joblib
from pathlib import Path

MODEL_DIR = Path(__file__).parent.parent / "models"

# These are loaded once at startup — same objects used by predictor.py
# Import them from predictor.py so we don't double-load
from app.services.predictor import get_crop_model, get_crop_scaler, get_crop_encoder, FEATURE_ORDER

# Build TreeExplainer once at startup (fast for XGBoost)
# This takes ~2 seconds on first import, then stays cached in memory
_explainer = None

def get_explainer():
    global _explainer
    if _explainer is None:
        _explainer = shap.TreeExplainer(get_crop_model())
    return _explainer


FEATURE_DISPLAY_NAMES = {
    "nitrogen":         "Nitrogen (N)",
    "phosphorus":       "Phosphorus (P)",
    "potassium":        "Potassium (K)",
    "ph":               "Soil pH",
    "moisture":         "Soil Moisture",
    "soil_temperature": "Soil Temperature",
    "ec":               "Electrical Conductivity",
    "rainfall":         "Rainfall",
    "air_temperature":  "Air Temperature",
    "air_humidity":     "Air Humidity",
    "season_code":      "Season",
    "soil_type_code":   "Soil Type",
}

SEASON_LABELS    = {0: "Kharif", 1: "Rabi", 2: "Zaid"}
SOIL_TYPE_LABELS = {0: "Black Cotton", 1: "Red", 2: "Alluvial", 3: "Laterite", 4: "Sandy"}


def _format_value(feature: str, raw_value: float) -> str:
    """Return a human-readable string for a feature value."""
    if feature == "season_code":
        return SEASON_LABELS.get(int(raw_value), str(int(raw_value)))
    if feature == "soil_type_code":
        return SOIL_TYPE_LABELS.get(int(raw_value), str(int(raw_value)))
    if feature == "ph":
        return f"{raw_value:.2f}"
    if feature in ("nitrogen", "phosphorus", "potassium"):
        return f"{raw_value:.0f} mg/kg"
    if feature == "moisture":
        return f"{raw_value:.1f}%"
    if feature in ("soil_temperature", "air_temperature"):
        return f"{raw_value:.1f}°C"
    if feature == "ec":
        return f"{raw_value:.0f} µS/cm"
    if feature == "rainfall":
        return f"{raw_value:.0f} mm"
    if feature == "air_humidity":
        return f"{raw_value:.1f}%"
    return f"{raw_value:.2f}"


def explain_prediction(raw_input: dict, predicted_crop: str) -> dict:
    """
    Given raw (unscaled) feature dict and the predicted crop name,
    return a list of SHAP contributions for that crop class sorted
    from most positive to most negative.

    Returns:
    {
        "crop": "wheat",
        "base_value": 0.043,        # average model output for this class
        "factors": [
            {
                "feature":       "ph",
                "display_name":  "Soil pH",
                "value":         "7.2",          # human readable
                "shap_value":    0.312,           # + = pushed toward this crop
                "direction":     "positive",      # or "negative"
                "strength":      "strong",        # strong / moderate / weak
                "explanation":   "Your pH of 7.2 supports wheat growth"
            },
            ...
        ]
    }
    """
    explainer = get_explainer()
    crop_scaler  = get_crop_scaler()
    crop_encoder = get_crop_encoder()

    # Build scaled input array in correct feature order
    X_raw    = np.array([[raw_input[f] for f in FEATURE_ORDER]], dtype=float)
    X_scaled = crop_scaler.transform(X_raw)

    # Get SHAP values — shape (1, n_features, n_classes) for multi-class XGBoost
    shap_values = explainer.shap_values(X_scaled)

    # Find the class index for the predicted crop
    classes    = list(crop_encoder.classes_)
    crop_index = classes.index(predicted_crop)

    # Handle both multi-class and single-output SHAP formats
    if isinstance(shap_values, list):
        # Multi-class: list of arrays, one per class
        sv_for_crop = np.array(shap_values[crop_index][0])
        base_val    = float(explainer.expected_value[crop_index])
    else:
        # Single output (binary or regression): 2D array (n_samples, n_features)
        sv_for_crop = np.array(shap_values[0])
        base_val    = float(explainer.expected_value) if np.isscalar(explainer.expected_value) else float(explainer.expected_value[0])

    # Build factor list
    factors = []
    for i, feat in enumerate(FEATURE_ORDER):
        sv        = float(sv_for_crop[i])
        raw_val   = raw_input[feat]
        abs_sv    = abs(sv)

        # Strength thresholds (tuned for XGBoost probability outputs)
        if abs_sv >= 0.15:
            strength = "strong"
        elif abs_sv >= 0.05:
            strength = "moderate"
        else:
            strength = "weak"

        direction = "positive" if sv >= 0 else "negative"

        # Auto-generate a plain-English explanation
        explanation = _generate_explanation(feat, raw_val, sv, predicted_crop)

        factors.append({
            "feature":      feat,
            "display_name": FEATURE_DISPLAY_NAMES.get(feat, feat),
            "value":        _format_value(feat, raw_val),
            "shap_value":   round(sv, 4),
            "abs_shap":     round(abs_sv, 4),
            "direction":    direction,
            "strength":     strength,
            "explanation":  explanation,
        })

    # Sort: strongest positive first, then strongest negative
    factors.sort(key=lambda x: x["shap_value"], reverse=True)

    # Only return top 6 most influential factors to keep UI clean
    top_factors = [f for f in factors if f["strength"] in ("strong", "moderate")][:6]
    if not top_factors:
        top_factors = factors[:4]   # fallback: always show at least 4

    return {
        "crop":       predicted_crop,
        "base_value": round(base_val, 4),
        "factors":    top_factors,
    }


def _generate_explanation(feature: str, value: float, shap_val: float, crop: str) -> str:
    """Generate a simple plain-English sentence for each SHAP factor."""
    pos = shap_val >= 0
    crop_display = crop.replace("_", " ").title()

    if feature == "ph":
        if pos:
            return f"Your pH of {value:.1f} is suitable for {crop_display}"
        else:
            return f"Your pH of {value:.1f} is not ideal for {crop_display}"

    if feature == "nitrogen":
        level = "high" if value > 100 else "moderate" if value > 50 else "low"
        return f"{'Adequate' if pos else 'Insufficient'} nitrogen ({value:.0f} mg/kg) — {level} level"

    if feature == "phosphorus":
        return f"Phosphorus at {value:.0f} mg/kg {'supports' if pos else 'limits'} {crop_display}"

    if feature == "potassium":
        return f"Potassium at {value:.0f} mg/kg {'benefits' if pos else 'is low for'} {crop_display}"

    if feature == "moisture":
        return f"Soil moisture of {value:.0f}% {'matches' if pos else 'does not match'} {crop_display} requirements"

    if feature == "rainfall":
        return f"Rainfall of {value:.0f} mm/yr {'is sufficient' if pos else 'is too low'} for {crop_display}"

    if feature == "soil_temperature":
        return f"Soil temperature of {value:.0f}°C {'favours' if pos else 'is unfavourable for'} {crop_display}"

    if feature == "air_temperature":
        return f"Air temperature of {value:.0f}°C {'suits' if pos else 'does not suit'} {crop_display} season"

    if feature == "air_humidity":
        return f"Humidity of {value:.0f}% {'is good' if pos else 'is too low'} for {crop_display}"

    if feature == "ec":
        if pos:
            return f"Salinity (EC {value:.0f} µS/cm) is within tolerance for {crop_display}"
        else:
            return f"High salinity (EC {value:.0f} µS/cm) reduces suitability for {crop_display}"

    if feature == "season_code":
        label = SEASON_LABELS.get(int(value), str(int(value)))
        return f"{label} season {'is correct' if pos else 'is not ideal'} for {crop_display}"

    if feature == "soil_type_code":
        label = SOIL_TYPE_LABELS.get(int(value), str(int(value)))
        return f"{label} soil {'suits' if pos else 'is not ideal for'} {crop_display}"

    return f"{'Positive' if pos else 'Negative'} contribution from {feature}"
