/**
 * ML Client — Calls FastAPI ML server for predictions
 */
const ML_SERVER_URL = process.env.ML_SERVER_URL || "http://127.0.0.1:8000";
const ML_TIMEOUT = 15000; // 15 seconds max per ML call

export interface CropPredictionInput {
  n: number;
  p: number;
  k: number;
  ph: number;
  moisture: number;
  soil_temp: number;
  ec: number;
  rainfall: number;
  air_temp: number;
  humidity: number;
  season: "KHARIF" | "RABI" | "ZAID";
  soil_type: "BLACK_COTTON" | "RED" | "ALLUVIAL" | "LATERITE" | "SANDY";
}

export interface ExplanationReason {
  icon: string;
  title: string;
  description: string;
}

export interface CropPredictionResult {
  top_crop: string;
  confidence: number;
  rank_2: string;
  rank_2_confidence: number;
  rank_3: string;
  rank_3_confidence: number;
  low_confidence: boolean;
  ph_status: "ACIDIC" | "NEUTRAL" | "ALKALINE";
  n_status: "LOW" | "MEDIUM" | "HIGH";
  p_status: "LOW" | "MEDIUM" | "HIGH";
  k_status: "LOW" | "MEDIUM" | "HIGH";
  data_quality_status: string;
  data_quality_warnings: string[];
  explanation: {
    crop: string;
    base_value: number;
    factors: {
      feature: string;
      display_name: string;
      value: string;
      shap_value: number;
      abs_shap: number;
      direction: "positive" | "negative";
      strength: "strong" | "moderate" | "weak";
      explanation: string;
    }[];
  };
}

export interface FertilizerScheduleItem {
  phase: string;
  name: string;
  dose_kg: number;
  percentage: number;
  timing: string;
  purpose: string;
  date_range?: string;
}

export interface IrrigationScheduleItem {
  phase: string;
  action_title: string;
  days_interval: number;
  water_volume_liters_per_acre: number;
  purpose: string;
  weather_suspended: boolean;
}

export interface FertilizerPredictionResult {
  fertilizer_name: string;
  total_dose_kg: number;
  dose_per_acre: number;
  application_schedule: FertilizerScheduleItem[];
  irrigation_schedule: IrrigationScheduleItem[];
  notes: string;
}

export async function predictCrop(
  input: CropPredictionInput
): Promise<CropPredictionResult> {
  const response = await fetch(`${ML_SERVER_URL}/predict/crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(ML_TIMEOUT),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ML prediction failed: ${error}`);
  }

  return response.json();
}

export async function predictFertilizer(input: {
  crop_name: string;
  n: number;
  p: number;
  k: number;
  soil_type: string;
  moisture: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  growth_stage?: string;
  land_area_acres: number;
}): Promise<FertilizerPredictionResult> {
  const response = await fetch(`${ML_SERVER_URL}/predict/fertilizer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(ML_TIMEOUT),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fertilizer prediction failed: ${error}`);
  }

  return response.json();
}

export async function checkMLHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
