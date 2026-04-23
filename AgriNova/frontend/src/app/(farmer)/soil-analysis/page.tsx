"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Beaker, Info, AlertTriangle } from "lucide-react";

function SoilAnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nitrogenN: searchParams.get("n") || "",
    phosphorusP: searchParams.get("p") || "",
    potassiumK: searchParams.get("k") || "",
    ph: searchParams.get("ph") || "",
    moisture: searchParams.get("m") || "",
    temperatureSoil: searchParams.get("t") || "",
    ec: searchParams.get("ec") || "",
    previousCrop: "",
    cropPlanted: false,
    plantedCropName: "",
    plantingDate: "",
  });

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const n = parseFloat(formData.nitrogenN);
    const p = parseFloat(formData.phosphorusP);
    const k = parseFloat(formData.potassiumK);
    const ph = parseFloat(formData.ph);
    const moisture = parseFloat(formData.moisture);
    const temp = parseFloat(formData.temperatureSoil);
    const ec = parseFloat(formData.ec);

    if (isNaN(n) || n < 0 || n > 1999) errs.nitrogenN = "Nitrogen: 0-1999 mg/kg";
    if (isNaN(p) || p < 0 || p > 1999) errs.phosphorusP = "Phosphorus: 0-1999 mg/kg";
    if (isNaN(k) || k < 0 || k > 1999) errs.potassiumK = "Potassium: 0-1999 mg/kg";
    if (isNaN(ph) || ph < 0 || ph > 14) errs.ph = "pH: 0-14";
    if (isNaN(moisture) || moisture < 0 || moisture > 100) errs.moisture = "Moisture: 0-100%";
    if (isNaN(temp) || temp < -40 || temp > 80) errs.temperatureSoil = "Temperature: -40 to 80°C";
    if (isNaN(ec) || ec < 0 || ec > 10000) errs.ec = "EC: 0-10000 µS/cm";

    if (formData.cropPlanted && !formData.plantedCropName) {
      errs.plantedCropName = "Crop name is required when already planted";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/soil/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nitrogenN: parseFloat(formData.nitrogenN),
          phosphorusP: parseFloat(formData.phosphorusP),
          potassiumK: parseFloat(formData.potassiumK),
          ph: parseFloat(formData.ph),
          moisture: parseFloat(formData.moisture),
          temperatureSoil: parseFloat(formData.temperatureSoil),
          ec: parseFloat(formData.ec),
          previousCrop: formData.previousCrop,
          cropPlanted: formData.cropPlanted,
          plantedCropName: formData.plantedCropName,
          plantingDate: formData.plantingDate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to results page with record ID
        router.push(`/results?id=${data.recordId}`);
      } else {
        const err = await res.json();
        setErrors({ submit: err.error || "Analysis failed" });
      }
    } catch {
      setErrors({ submit: "Failed to connect to analysis server" });
    } finally {
      setLoading(false);
    }
  };

  const inputField = (
    label: string,
    field: string,
    placeholder: string,
    unit: string,
    info?: string,
    min?: number,
    max?: number
  ) => (
    <div className="form-group">
      <label className="form-label" htmlFor={`soil-${field}`}>
        {label}
        {unit && <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.25rem" }}>({unit})</span>}
      </label>
      <input
        id={`soil-${field}`}
        className="form-input"
        type="number"
        step="0.1"
        min={min}
        max={max}
        placeholder={placeholder}
        value={formData[field as keyof typeof formData] as string}
        onChange={(e) => {
          // Block typing of negative values or out of bounds when directly modified
          let val = e.target.value;
          if (val && min !== undefined && parseFloat(val) < min) return;
          if (val && max !== undefined && parseFloat(val) > max) val = String(max);
          update(field, val);
        }}
        style={errors[field] ? { borderColor: "var(--danger)" } : {}}
      />
      {errors[field] && <span className="form-error">{errors[field]}</span>}
      {info && (
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Info size={12} /> {info}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main className="page-container animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="section-label">SOIL PARAMETER INPUT</p>
          <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>
            New Soil Analysis
          </h1>
          <p className="section-subtitle">
            Enter the 7 sensor readings from your soil test. Weather data will be
            auto-fetched from your registered GPS coordinates.
          </p>
        </div>

        {errors.submit && (
          <div style={{ padding: "1rem", background: "#fee2e2", color: "var(--danger)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} /> {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Sensor Readings */}
          <div className="card" style={{ marginBottom: "1.5rem", padding: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
              <Beaker size={18} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "middle" }} />
              Sensor Readings
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
              {inputField("Nitrogen (N)", "nitrogenN", "e.g. 90", "mg/kg", "Primary macronutrient", 0, 1999)}
              {inputField("Phosphorus (P)", "phosphorusP", "e.g. 42", "mg/kg", "Root development", 0, 1999)}
              {inputField("Potassium (K)", "potassiumK", "e.g. 43", "mg/kg", "Disease resistance", 0, 1999)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.25rem" }}>
              {inputField("Soil pH", "ph", "e.g. 6.5", "0-14", "6.5-7.0 is optimal", 0, 14)}
              {inputField("Moisture", "moisture", "e.g. 45", "%vol", "Volumetric water content", 0, 100)}
              {inputField("Soil Temperature", "temperatureSoil", "e.g. 28", "°C", undefined, -40, 80)}
              {inputField("EC", "ec", "e.g. 1500", "µS/cm", "Electrical conductivity", 0, 10000)}
            </div>
          </div>

          {/* Additional Info */}
          <div className="card" style={{ marginBottom: "1.5rem", padding: "2rem" }}>
            <h3 style={{ marginBottom: "1.5rem" }}>Additional Information</h3>

            <div className="form-row" style={{ marginBottom: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Previous Crop Grown</label>
                <select
                  className="form-select"
                  value={formData.previousCrop}
                  onChange={(e) => update("previousCrop", e.target.value)}
                >
                  <option value="">Select previous crop</option>
                  <option value="rice">Rice</option>
                  <option value="wheat">Wheat</option>
                  <option value="maize">Maize</option>
                  <option value="cotton">Cotton</option>
                  <option value="soybean">Soybean</option>
                  <option value="sugarcane">Sugarcane</option>
                  <option value="jowar">Jowar</option>
                  <option value="bajra">Bajra</option>
                  <option value="chickpea">Chickpea</option>
                  <option value="none">None / Fallow</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: "0.75rem" }}>Crop Already Planted?</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="cropPlanted"
                      checked={formData.cropPlanted}
                      onChange={() => update("cropPlanted", true as unknown as string)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    Yes
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="cropPlanted"
                      checked={!formData.cropPlanted}
                      onChange={() => update("cropPlanted", false as unknown as string)}
                      style={{ accentColor: "var(--primary)" }}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>

            {formData.cropPlanted && (
              <div className="form-row animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Planted Crop Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Maize"
                    value={formData.plantedCropName}
                    onChange={(e) => update("plantedCropName", e.target.value)}
                    style={errors.plantedCropName ? { borderColor: "var(--danger)" } : {}}
                  />
                  {errors.plantedCropName && <span className="form-error">{errors.plantedCropName}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Planting Date</label>
                  <input
                    className="form-input"
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={formData.plantingDate}
                    onChange={(e) => update("plantingDate", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info banner */}
          <div style={{ padding: "1rem 1.25rem", background: "var(--primary-50)", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Info size={18} color="var(--primary)" />
            <p style={{ fontSize: "0.85rem", color: "var(--primary-700)" }}>
              Weather data (air temperature, humidity, rainfall) will be automatically fetched from your registered GPS coordinates.
              Season is determined from the current date.
            </p>
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              id="analyze-soil-btn"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ borderTopColor: "white" }} />
                  Analyzing...
                </>
              ) : (
                <>
                  <Beaker size={18} />
                  Analyze Soil & Get Recommendation
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

export default function SoilAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: "3rem" }}>Loading Calculator...</div>}>
       <SoilAnalysisContent />
    </Suspense>
  )
}
