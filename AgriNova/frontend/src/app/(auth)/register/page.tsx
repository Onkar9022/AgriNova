"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, MapPin, ArrowRight, Leaf } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    soilType: "BLACK_COTTON",
    irrigationType: "DRIP",
    landAreaAcres: "",
    primaryCrop: "Cereals",
    state: "",
    district: "",
    taluka: "",
    gpsLat: "",
    gpsLng: "",
  });

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const fetchLocation = () => {
    setFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          update("gpsLat", position.coords.latitude.toFixed(6));
          update("gpsLng", position.coords.longitude.toFixed(6));
          setFetchingLocation(false);
        },
        () => {
          setFetchingLocation(false);
          setError("Could not get location. Please enter manually.");
        }
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          landAreaAcres: parseFloat(formData.landAreaAcres) || 0,
          gpsLat: parseFloat(formData.gpsLat) || 0,
          gpsLng: parseFloat(formData.gpsLng) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/login");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Personal Profile" },
    { num: 2, label: "Farm & Soil Details" },
    { num: 3, label: "Location Mapping" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Navbar */}
      <nav className="navbar">
        <Link href="/" className="navbar-brand">AgriNova</Link>
        <ul className="navbar-links">
          <li><Link href="/dashboard" className="navbar-link">Dashboard</Link></li>
          <li><Link href="/soil-analysis" className="navbar-link">Soil Analysis</Link></li>
          <li><Link href="/history" className="navbar-link">History</Link></li>
        </ul>
        <div className="navbar-actions">
          <div className="avatar">
            <Leaf size={16} color="var(--primary)" />
          </div>
        </div>
      </nav>

      <div className="page-container">
        {/* Hero Banner */}
        <div className="hero-banner" style={{ marginBottom: "2.5rem" }}>
          <span className="badge badge-danger" style={{ marginBottom: "0.75rem" }}>
            BEGIN YOUR JOURNEY
          </span>
          <h1 style={{ color: "white", fontSize: "2.25rem", marginBottom: "0.75rem" }}>
            Join the next generation of farming.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", maxWidth: 400, lineHeight: 1.6 }}>
            Complete your profile to unlock precise soil analysis, harvest predictions,
            and localized weather insights tailored for your land.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "3rem" }}>
          {/* Sidebar Steps */}
          <div>
            <p className="section-label" style={{ marginBottom: "1rem" }}>
              Registration Steps
            </p>
            {steps.map((s) => (
              <div
                key={s.num}
                className="step-item"
                style={{ cursor: "pointer" }}
                onClick={() => setStep(s.num)}
              >
                <span
                  className={`step-number ${
                    step === s.num ? "active" : step > s.num ? "completed" : "pending"
                  }`}
                >
                  {s.num}
                </span>
                <span style={{ fontWeight: step === s.num ? 600 : 400 }}>
                  {s.label}
                </span>
              </div>
            ))}

            {/* Info Card */}
            <div className="info-card-green" style={{ marginTop: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Shield size={18} color="var(--primary)" />
                <h4>Secure & Private</h4>
              </div>
              <p>
                Your farm data is encrypted and only used to provide you with scientific
                insights. We never share specific location data with third parties.
              </p>
            </div>
          </div>

          {/* Form Body */}
          <div className="card animate-fade-in" style={{ padding: "2rem" }}>
            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "var(--danger)", borderRadius: "var(--radius-md)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                {error}
              </div>
            )}

            {/* Step 1: Personal Identity */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  Personal Identity
                </h2>

                <div className="form-row" style={{ marginBottom: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-name">Full Name</label>
                    <input id="reg-name" className="form-input" placeholder="e.g. Rajesh Kumar" value={formData.name} onChange={(e) => update("name", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">Email (Optional)</label>
                    <input id="reg-email" className="form-input" type="email" placeholder="farmer@example.com" value={formData.email} onChange={(e) => update("email", e.target.value)} />
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">Mobile Number (Login ID)</label>
                    <input id="reg-phone" className="form-input" type="tel" placeholder="+91 00000 00000" value={formData.phone} onChange={(e) => update("phone", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-password">Create Password</label>
                    <input id="reg-password" className="form-input" type="password" placeholder="••••••••" value={formData.password} onChange={(e) => update("password", e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary" onClick={() => setStep(2)} id="step1-next-btn">
                    Next: Farm Details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Farm Assets */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  Farm Assets
                </h2>

                <div className="form-row" style={{ marginBottom: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">Soil Type</label>
                    <select className="form-select" value={formData.soilType} onChange={(e) => update("soilType", e.target.value)}>
                      <option value="BLACK_COTTON">Black Cotton</option>
                      <option value="RED">Red</option>
                      <option value="ALLUVIAL">Alluvial</option>
                      <option value="LATERITE">Laterite</option>
                      <option value="SANDY">Sandy</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Irrigation Method</label>
                    <select className="form-select" value={formData.irrigationType} onChange={(e) => update("irrigationType", e.target.value)}>
                      <option value="DRIP">Drip Irrigation</option>
                      <option value="FLOOD">Flood</option>
                      <option value="RAINFED">Rainfed</option>
                      <option value="SPRINKLER">Sprinkler</option>
                    </select>
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: "1.5rem" }}>
                  <div className="form-group">
                    <label className="form-label">Total Land Area (Acres)</label>
                    <input className="form-input" type="number" step="0.1" placeholder="0.0" value={formData.landAreaAcres} onChange={(e) => update("landAreaAcres", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Crop Category</label>
                    <select className="form-select" value={formData.primaryCrop} onChange={(e) => update("primaryCrop", e.target.value)}>
                      <option value="Cereals">Cereals</option>
                      <option value="Pulses">Pulses</option>
                      <option value="Oilseeds">Oilseeds</option>
                      <option value="Cash Crops">Cash Crops</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Vegetables">Vegetables</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)} id="step2-next-btn">
                    Next: Location <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Geospatial Data */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)" }}>
                  Geospatial Data
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" placeholder="Maharashtra" value={formData.state} onChange={(e) => update("state", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">District</label>
                    <input className="form-input" placeholder="Pune" value={formData.district} onChange={(e) => update("district", e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Taluka</label>
                    <input className="form-input" placeholder="Haveli" value={formData.taluka} onChange={(e) => update("taluka", e.target.value)} />
                  </div>
                </div>

                {/* Map placeholder with auto-fetch button */}
                <div
                  style={{
                    background: "linear-gradient(135deg, var(--primary-dark) 0%, var(--brown) 100%)",
                    borderRadius: "var(--radius-lg)",
                    padding: "3rem 2rem",
                    textAlign: "center",
                    marginBottom: "1.5rem",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <button
                    className="btn btn-outline"
                    onClick={fetchLocation}
                    disabled={fetchingLocation}
                    style={{ background: "white", fontWeight: 600 }}
                    id="auto-fetch-location-btn"
                  >
                    <MapPin size={16} />
                    {fetchingLocation ? "Fetching..." : "Auto-fetch Current Location"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", marginTop: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Pinpoints your field for weather accuracy
                  </p>
                  {formData.gpsLat && (
                    <p style={{ color: "white", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                      📍 {formData.gpsLat}, {formData.gpsLng}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button className="btn btn-outline" onClick={() => setStep(2)}>← Back</button>
                    <button className="btn btn-ghost" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.8rem" }}>
                      Save Draft & Finish Later
                    </button>
                  </div>
                  <button
                    className="btn btn-accent btn-lg"
                    onClick={handleSubmit}
                    disabled={loading}
                    id="complete-registration-btn"
                  >
                    {loading ? (
                      <>
                        <div className="spinner" style={{ borderTopColor: "white" }} />
                        Registering...
                      </>
                    ) : (
                      <>
                        Complete Registration <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer" style={{ marginTop: "3rem" }}>
        <div className="footer-grid">
          <div>
            <p style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>AgriNova</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Empowering farmers through data science and localized agronomical intelligence.
            </p>
          </div>
          <div>
            <h4 className="footer-heading">Support</h4>
            <a href="#" className="footer-link">Contact Support</a>
            <a href="#" className="footer-link">Status: All Systems Operational</a>
          </div>
          <div>
            <h4 className="footer-heading">Legal</h4>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", marginTop: "1.5rem", paddingTop: "1rem" }}>
          <p className="footer-copyright">© {new Date().getFullYear()} AgriNova Digital Agronomist. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
