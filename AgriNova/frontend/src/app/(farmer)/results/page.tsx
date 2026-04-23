"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  Printer,
  Share2,
  Save,
  ChevronRight,
  CheckCircle,
  Info,
  AlertTriangle,
  Droplets,
} from "lucide-react";
import SHAPExplanation from "@/components/results/SHAPExplanation";
import AiInsight from "@/components/ai/AiInsight";

interface AnalysisResult {
  recordId: string;
  aestheticImageUrl?: string;
  crop: {
    top_crop: string;
    confidence: number;
    rank_2: string;
    rank_2_confidence: number;
    rank_3: string;
    rank_3_confidence: number;
    low_confidence: boolean;
    ph_status: string;
    n_status: string;
    p_status: string;
    k_status: string;
    data_quality_warnings: string[];
  };
  fertilizer: {
    fertilizer_name: string;
    total_dose_kg: number;
    dose_per_acre: number;
    application_schedule: {
      phase: string;
      name: string;
      dose_kg: number;
      percentage: number;
      timing: string;
      purpose: string;
    }[];
    irrigation_schedule?: {
      phase: string;
      action_title: string;
      days_interval: number;
      water_volume_liters_per_acre: number;
      purpose: string;
      weather_suspended: boolean;
    }[];
  };
  soilReading: {
    ph: number;
    nitrogenN: number;
    phosphorusP: number;
    potassiumK: number;
    moisture: number;
    cropPlanted?: boolean;
    plantedCropName?: string;
    daysSincePlanting?: number | null;
  };
  explanation?: any;
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Stable report number derived from recordId (not random on every render)
  const reportNumber = result?.recordId
    ? result.recordId.replace(/\D/g, "").slice(0, 4).padStart(4, "0")
    : "0000";

  useEffect(() => {
    const historicalId = searchParams.get("id");
    
    if (historicalId) {
      fetch(`/api/soil/history/${historicalId}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to load report");
          return res.json();
        })
        .then(data => {
          if (data.recordId) setResult(data);
          else setLoadError("Report not found. It may have been deleted.");
        })
        .catch(() => setLoadError("Could not load historical report. Please try again."));
      return;
    }

    const stored = sessionStorage.getItem("soilAnalysisResult");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.recordId && parsed?.crop && parsed?.fertilizer) {
          setResult(parsed);
        } else {
          sessionStorage.removeItem("soilAnalysisResult");
          setLoadError("Incomplete analysis data. Please run a new analysis.");
        }
      } catch {
        sessionStorage.removeItem("soilAnalysisResult");
        setLoadError("Corrupted analysis data. Please run a new analysis.");
      }
    } else {
      setLoadError("No analysis data found. Please run a soil analysis first.");
    }
  }, [searchParams]);

  if (loadError) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main className="page-container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ textAlign: "center", padding: "3rem", maxWidth: "500px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧪</div>
            <h2 style={{ marginBottom: "0.75rem" }}>No Analysis Data</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>{loadError}</p>
            <a href="/soil-analysis" className="btn btn-primary">Start New Analysis</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  const { crop, fertilizer, soilReading } = result;

  const nutrientWidth = (status: string) => {
    switch (status) {
      case "HIGH": return "85%";
      case "MEDIUM": return "55%";
      case "LOW": return "25%";
      default: return "50%";
    }
  };

  const nutrientColor = (status: string) => {
    switch (status) {
      case "HIGH": return "nutrient-high";
      case "MEDIUM": return "nutrient-medium";
      case "LOW": return "nutrient-low";
      default: return "nutrient-medium";
    }
  };

  const phPosition = () => {
    // Map pH 0-14 to 0-100%
    return `${(soilReading.ph / 14) * 100}%`;
  };

  const isPlantedActive = soilReading.cropPlanted && !showAlternatives;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main className="page-container animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="section-label" style={{ marginBottom: "0.25rem" }}>
            ANALYSIS COMPLETE • REPORT #{reportNumber}
          </p>
          <h1 className="section-title">
            {isPlantedActive ? `Fertilizer Schedule for ${soilReading.plantedCropName}` : "Optimal Crop Selection"}
          </h1>
          <p className="section-subtitle">
            {isPlantedActive 
              ? "We've generated a strict nutrient roadmap based on the current age and state of your planted crop."
              : "Based on the recent soil sample, we have identified the crop with the highest yield potential for the upcoming season."}
          </p>
        </div>

        {/* Low confidence warning (only if predicting crops) */}
        {!isPlantedActive && crop.low_confidence && (
          <div style={{ padding: "1rem 1.25rem", background: "#fef3c7", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <AlertTriangle size={18} color="var(--accent)" />
            <p style={{ fontSize: "0.85rem", color: "var(--accent-dark)" }}>
              <strong>Low confidence prediction.</strong> Please verify pH and EC readings.
              Multiple crop options are shown below for your consideration.
            </p>
          </div>
        )}

        {/* AI Generated Crop Aesthetics Cover */}
        {result.aestheticImageUrl && (
          <div className="print-hide print-bg-force" style={{ width: "100%", height: 180, borderRadius: "var(--radius-lg)", overflow: "hidden", marginBottom: "2rem", position: "relative" }}>
             <img src={result.aestheticImageUrl} alt="Crop Visualization" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
             <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1rem", background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)", color: "white" }}>
                <span className="badge" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>AI VISUALIZATION</span>
             </div>
          </div>
        )}

        {isPlantedActive && (
          <div className="card" style={{ marginBottom: "2.5rem", borderLeft: "4px solid var(--accent)" }}>
             <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--primary)" }}>Planted Crop Status</h2>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                   <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Detected Crop Age</p>
                   <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>{soilReading.daysSincePlanting ?? 0} Days</p>
                </div>
                <div>
                   <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Expected Vegetative Phase</p>
                   <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>{fertilizer.application_schedule[1]?.purpose || "Vegetative Growth"}</p>
                </div>
             </div>
             
             <button 
                onClick={() => setShowAlternatives(true)}
                className="btn btn-outline" 
                style={{ marginTop: "1.5rem" }}>
                Suggest Alternative Crops
             </button>
          </div>
        )}

        {/* Top Recommendation + Rank Cards (Hidden if Planted) */}
        {!isPlantedActive && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", marginBottom: "2.5rem" }}>
            {/* Main Recommendation */}
          <div className="top-recommendation">
            <div style={{ position: "relative", zIndex: 1 }}>
              <span className="badge badge-success" style={{ marginBottom: "1rem" }}>
                TOP RECOMMENDATION
              </span>
              <h2 style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)", marginBottom: "0.25rem" }}>
                {crop.top_crop}
              </h2>
              <p style={{ fontSize: "1.5rem", fontWeight: 600, color: "var(--primary-400)", marginBottom: "1rem" }}>
                {crop.confidence}% Confidence
              </p>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: 380, lineHeight: 1.6, marginBottom: "1.5rem" }}>
                Your soil composition shows exceptional suitability for lowland {crop.top_crop.toLowerCase()} varieties,
                specifically targeting a harvest window in late Autumn.
              </p>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button className="btn btn-primary" id="start-planning-btn">Start Planning</button>
                <button className="btn btn-outline" id="view-varietals-btn">View Varietals</button>
              </div>
            </div>
          </div>

          {/* Rank 2 & 3 + Moisture */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="recommendation-rank-card">
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                🌾
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>
                  RANK 2 • {crop.rank_2_confidence}%
                </p>
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{crop.rank_2}</p>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            <div className="recommendation-rank-card">
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                🌽
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary)" }}>
                  RANK 3 • {crop.rank_3_confidence}%
                </p>
                <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{crop.rank_3}</p>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>

            {/* Moisture Content Badge */}
            <div className="moisture-badge">
              <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "rgba(255,255,255,0.7)" }}>
                Moisture Content
              </p>
              <p style={{ fontSize: "2rem", fontWeight: 800 }}>{soilReading.moisture}%</p>
              <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
                Ideal range for semi-aquatic crops
              </p>
            </div>
          </div>
        </div>

        {/* Machine Learning Explainability: SHAP Framework */}
        {!isPlantedActive && result.explanation && (
          <SHAPExplanation explanation={result.explanation} />
        )}

        {/* AI Crop Recommendation Reasoning */}
        {!isPlantedActive && (
          <div style={{ marginBottom: "2rem" }}>
            <AiInsight
              type="crop_explain"
              data={{
                crop: crop.top_crop,
                confidence: crop.confidence,
                ph: soilReading.ph,
                n: soilReading.nitrogenN,
                p: soilReading.phosphorusP,
                k: soilReading.potassiumK,
                moisture: soilReading.moisture,
                rainfall: 200,
              }}
              title="✨ Ask AI — Why this crop?"
            />
          </div>
        )}
        </>
        )}

        {/* Soil Health Report (Always Available) */}
        {!isPlantedActive ? (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.25rem" }}>Soil Health Check</h2>
          </div>
        ) : null}
        
          <div className="card" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <span style={{ fontSize: "1.25rem" }}>🧪</span>
              <h3 style={{ fontSize: "1.1rem" }}>Soil Health Report</h3>
            </div>

            {/* NPK Bars */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
              {[
                { label: "Nitrogen (N)", status: crop.n_status },
                { label: "Phosphorus (P)", status: crop.p_status },
                { label: "Potassium (K)", status: crop.k_status },
              ].map((nutrient) => (
                <div key={nutrient.label}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                    {nutrient.label}
                  </p>
                  <div className="nutrient-bar">
                    <div
                      className={`nutrient-fill ${nutrientColor(nutrient.status)}`}
                      style={{ width: nutrientWidth(nutrient.status) }}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, marginTop: "0.35rem", color: nutrient.status === "HIGH" ? "var(--primary)" : nutrient.status === "LOW" ? "var(--danger)" : "var(--accent)" }}>
                    {nutrient.status}
                  </p>
                </div>
              ))}
            </div>

            {/* pH Level */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Soil pH Level
                </p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800 }}>{soilReading.ph}</p>
              </div>
              <div className="ph-gradient-bar">
                <div className="ph-indicator" style={{ left: phPosition() }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ACIDIC</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>NEUTRAL</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>ALKALINE</span>
              </div>
            </div>
          </div>

          {/* AI Soil Health Analysis */}
          <AiInsight
            type="soil_health"
            data={{
              ph: soilReading.ph,
              n: soilReading.nitrogenN,
              p: soilReading.phosphorusP,
              k: soilReading.potassiumK,
              moisture: soilReading.moisture,
              ec: 0,
              soilTemp: 0,
            }}
            title="✨ Ask AI — Soil health analysis"
          />

        {/* Targeted Nutrition Schedule */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.25rem" }}>
            Targeted Nutrition Schedule
          </h2>
          <div className="grid-3">
            {fertilizer.application_schedule.map((item, i) => (
              <div key={i} className="schedule-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span className={`schedule-phase phase-${i + 1}`}>{item.phase}</span>
                  <span className="badge badge-success" style={{
                    background: i === 0 ? "var(--primary-100)" : i === 1 ? "var(--accent-100)" : "#fee2e2",
                    color: i === 0 ? "var(--primary)" : i === 1 ? "var(--accent)" : "var(--danger)",
                  }}>
                    {item.percentage}% Total
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{item.name}</p>
                <p className={`schedule-dose phase-${i + 1}`}>{item.dose_kg} kg</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                  per acre {item.timing.toLowerCase()}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  📅 {item.timing}
                </div>
              </div>
            ))}
          </div>

          {/* AI Fertilizer Reasoning */}
          <AiInsight
            type="fertilizer_explain"
            data={{
              crop: isPlantedActive ? soilReading.plantedCropName : crop.top_crop,
              fertilizer: fertilizer.fertilizer_name,
              n: soilReading.nitrogenN,
              p: soilReading.phosphorusP,
              k: soilReading.potassiumK,
              ph: soilReading.ph,
            }}
            title="✨ Ask AI — Why this fertilizer?"
          />
        </div>

        {/* Irrigation & Water Cycle */}
        {fertilizer.irrigation_schedule && fertilizer.irrigation_schedule.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Droplets size={22} color="var(--primary)" /> Irrigation & Water Cycle
            </h2>
            <div className="grid-3" style={{ gridTemplateColumns: `repeat(${fertilizer.irrigation_schedule.length}, 1fr)` }}>
              {fertilizer.irrigation_schedule.map((item, i) => (
                <div key={i} className="card" style={{
                  padding: "1.5rem",
                  borderLeft: item.weather_suspended ? "4px solid var(--accent)" : "4px solid var(--primary)",
                  opacity: item.weather_suspended ? 0.75 : 1,
                  position: "relative",
                  overflow: "hidden",
                }}>
                  {item.weather_suspended && (
                    <div style={{
                      position: "absolute", top: 0, right: 0,
                      background: "var(--accent)", color: "white",
                      fontSize: "0.65rem", fontWeight: 700,
                      padding: "0.25rem 0.75rem", borderBottomLeftRadius: "var(--radius-md)",
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      🌧️ Rain Suspended
                    </div>
                  )}
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    {item.phase}
                  </p>
                  <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem" }}>{item.action_title}</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: item.weather_suspended ? "var(--accent)" : "var(--primary)" }}>
                      {item.days_interval}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>day interval</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                    {item.purpose}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    <Droplets size={14} /> {(item.water_volume_liters_per_acre / 1000).toFixed(0)}K liters / acre
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="print-hide" style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
          <button className="btn btn-outline" id="print-report-btn" onClick={() => window.print()}>
            <Printer size={16} /> Print Report (PDF)
          </button>
          <button className="btn btn-outline" id="share-btn" onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setToast("Link copied to clipboard!");
            setTimeout(() => setToast(null), 2500);
          }}>
            <Share2 size={16} /> Share Link
          </button>
          <button className="btn btn-accent" id="save-history-btn" onClick={() => router.push("/history")}>
            <Save size={16} /> View in History (Saved)
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
            background: "var(--primary)", color: "white", padding: "0.75rem 1.5rem",
            borderRadius: "var(--radius-md)", fontSize: "0.85rem", fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 1000,
            animation: "fadeInUp 0.3s ease-out",
          }}>
            ✓ {toast}
          </div>
        )}
      </main>

      <div className="print-hide">
        <Footer />
      </div>

      {/* Print Specifically Scoped CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
           .print-hide { display: none !important; }
           .page-container { padding: 0; margin: 0; max-width: 100%; box-shadow: none; }
           .top-recommendation { break-inside: avoid; border: 2px solid #EEE; box-shadow: none; }
           .card { break-inside: avoid; border: 1px solid #CCC; box-shadow: none; }
           .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr) !important; gap: 1rem; }
           .nutrient-fill { border: 1px solid rgba(0,0,0,0.1); }
           .ph-indicator { border: 2px solid #000; }
        }
      `}} />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "3rem" }}>Loading Results Report...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
