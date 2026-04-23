import Link from "next/link";
import { 
  Wifi, 
  Cpu, 
  FileText, 
  FlaskConical, 
  Sparkles, 
  CalendarDays, 
  TrendingUp, 
  CheckCircle2, 
  MapPin
} from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fbfaf8", fontFamily: "var(--font-inter), sans-serif", overflowX: "hidden" }}>
      
      {/* NAVBAR */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 4rem", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em" }}>
          AgriNova
        </div>
        <div style={{ display: "flex", gap: "2rem", listStyle: "none", fontSize: "0.95rem", color: "#4b5563", fontWeight: 500 }}>
          <span style={{ borderBottom: "2px solid #8b4513", color: "#111827", paddingBottom: "0.25rem", cursor: "pointer" }}>Platform</span>
          <span style={{ cursor: "pointer" }}>Soil Monitoring</span>
          <span style={{ cursor: "pointer" }}>Health Trends</span>
          <span style={{ cursor: "pointer" }}>Resources</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/login" style={{ color: "#4b5563", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}>
            Login
          </Link>
          <Link href="/register" style={{ backgroundColor: "#163c24", color: "white", padding: "0.6rem 1.25rem", borderRadius: "8px", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", padding: "5rem 4rem", alignItems: "center" }}>
        
        {/* Left Side */}
        <div>
          <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "0.35rem 1rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", display: "inline-block", marginBottom: "1.5rem" }}>
            NEXT GEN AGRICULTURE
          </span>
          <h1 style={{ fontSize: "5rem", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#111827", marginBottom: "1.5rem" }}>
            The Digital <br />
            <span style={{ color: "#8b4513" }}>Agronomist</span> in <br />
            Your Pocket
          </h1>
          <p style={{ fontSize: "1.1rem", color: "#4b5563", lineHeight: 1.6, maxWidth: "480px", marginBottom: "2.5rem" }}>
            Harness real-time soil analysis and AI-driven insights to achieve 99% accurate crop recommendations. Optimize your yield with precision data.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/soil-analysis" style={{ backgroundColor: "#8b4513", color: "white", padding: "1rem 2rem", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", textDecoration: "none", boxShadow: "0 4px 14px rgba(139, 69, 19, 0.25)" }}>
              Start Free Analysis
            </Link>
            <Link href="/register" style={{ backgroundColor: "transparent", border: "1px solid #d1d5db", color: "#374151", padding: "1rem 2rem", borderRadius: "8px", fontWeight: 600, fontSize: "1rem", textDecoration: "none" }}>
              Register Your Farm
            </Link>
          </div>
        </div>

        {/* Right Side */}
        <div style={{ position: "relative" }}>
          {/* Farm Cover Image Wrapper */}
          <div style={{ height: "600px", borderRadius: "24px", overflow: "hidden", background: "linear-gradient(to bottom, #d1d5db, #9ca3af)", position: "relative" }}>
            {/* Fallback image if user hasn't supplied one, creating a mock landscape gradient to simulate the image */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(190deg, #6ea4bf 0%, #ff8c42 45%, #2d5a27 50%, #163c24 100%)", opacity: 0.8 }} />
            
            {/* Real Image Placeholder (User can place farm_hero.jpg in public if wanted) */}
            <img src="/farm_hero.jpg" alt="Farm Sunset" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* Floating Widget */}
          <div style={{ position: "absolute", bottom: "3rem", left: "-2rem", backgroundColor: "white", padding: "1.5rem", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)", width: "320px", zIndex: 10 }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ backgroundColor: "#163c24", width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp color="white" size={20} />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 600, marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Real-time Soil Moisture</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>34.2%</span>
                  <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>Optimal</span>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div style={{ height: "6px", backgroundColor: "#f3f4f6", borderRadius: "3px", marginTop: "1.25rem", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "65%", backgroundColor: "#163c24", borderRadius: "3px" }} />
            </div>
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section style={{ padding: "6rem 4rem", backgroundColor: "#f9f9f9" }}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "2.75rem", fontWeight: 700, color: "#111827", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            The Precision Workflow
          </h2>
          <p style={{ color: "#4b5563", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto", lineHeight: 1.6 }}>
            From ground truth to actionable growth strategies—integrated, automated, and scientific.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "20px", border: "1px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ backgroundColor: "#dcfce7", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <Wifi color="#16a34a" size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>01. Soil Sensing</h3>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6 }}>Multi-depth probe sensors capture NPK levels, moisture, and pH balance every 15 minutes.</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "20px", border: "1px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ backgroundColor: "#ffedd5", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <Cpu color="#ea580c" size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>02. AI Processing</h3>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6 }}>Our neural engine analyzes ground data against 20 years of historical climate and yield records.</p>
          </div>
          <div style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "20px", border: "1px solid #f3f4f6", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
            <div style={{ backgroundColor: "#ffe4e6", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
              <FileText color="#e11d48" size={24} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111827", marginBottom: "0.75rem" }}>03. Actionable Results</h3>
            <p style={{ color: "#6b7280", fontSize: "0.95rem", lineHeight: 1.6 }}>Receive precise schedules for irrigation, fertilization, and harvest timing directly on your device.</p>
          </div>
        </div>
      </section>

      {/* FEATURE GRID SECTION */}
      <section style={{ padding: "6rem 4rem", backgroundColor: "#fbfaf8", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "6rem", alignItems: "center", maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Left Side 2x2 Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
            <FlaskConical color="#111827" size={20} style={{ marginBottom: "1rem" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>NPK Monitoring</h4>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5 }}>Real-time Nitrogen, Phosphorus, and Potassium data visualization.</p>
          </div>

          <div style={{ backgroundColor: "#fdf8f4", padding: "2rem", borderRadius: "16px", border: "1px solid #fae8d9" }}>
            <Sparkles color="#8b4513" size={20} style={{ marginBottom: "1rem" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#8b4513", marginBottom: "0.5rem" }}>AI Recommendations</h4>
            <p style={{ fontSize: "0.85rem", color: "#9c5e31", lineHeight: 1.5 }}>Crop rotation and seed selection based on soil profile.</p>
          </div>

          <div style={{ backgroundColor: "#fdf8f4", padding: "2rem", borderRadius: "16px", border: "1px solid #fae8d9" }}>
            <CalendarDays color="#8b4513" size={20} style={{ marginBottom: "1rem" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#8b4513", marginBottom: "0.5rem" }}>Fertilizer Schedules</h4>
            <p style={{ fontSize: "0.85rem", color: "#9c5e31", lineHeight: 1.5 }}>Dynamic application windows to reduce waste and cost.</p>
          </div>

          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "16px", border: "1px solid #f3f4f6" }}>
            <TrendingUp color="#111827" size={20} style={{ marginBottom: "1rem" }} />
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>Growth Tracking</h4>
            <p style={{ fontSize: "0.85rem", color: "#6b7280", lineHeight: 1.5 }}>Satellite and sensor fusion to predict harvest maturity.</p>
          </div>
        </div>

        {/* Right Side Text */}
        <div>
          <h2 style={{ fontSize: "3.25rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1.5rem" }}>
            Scientific Precision for Every Acre.
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#4b5563", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            AgriNova doesn't just provide data; we provide certainty. Our platform integrates directly with your existing infrastructure to create a seamless feedback loop between the field and the office.
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <CheckCircle2 color="#163c24" size={24} style={{ marginTop: "0.15rem", flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Reduce Input Costs by 22%</h4>
                <p style={{ fontSize: "0.95rem", color: "#6b7280" }}>Stop guessing fertilizer amounts with precise NPK analytics.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <CheckCircle2 color="#163c24" size={24} style={{ marginTop: "0.15rem", flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Predict Yield with 95% Accuracy</h4>
                <p style={{ fontSize: "0.95rem", color: "#6b7280" }}>Forecasting models built on historical and environmental data.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section style={{ padding: "0 4rem", marginBottom: "6rem" }}>
        <div style={{ 
          background: "linear-gradient(135deg, #102e1b 0%, #1c5233 100%)", 
          borderRadius: "24px", 
          padding: "4rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Abstract background circles */}
          <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", left: "30%", top: "-50%" }} />
          <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.05)", left: "20%", top: "-100%" }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: "500px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <span style={{ backgroundColor: "#8b4513", color: "white", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em" }}>PHASE 2 RELEASE</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: 500 }}>Industrial Grade Hardware</span>
            </div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
              IoT Hardware: JXBS-3001 Integration
            </h2>
            <p style={{ fontSize: "1.05rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              Native support for the JXBS-3001 sensor suite. Military-grade soil monitoring for Nitrogen, Phosphorus, and Potassium with sub-millimeter depth accuracy.
            </p>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", padding: "2.5rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <h3 style={{ fontSize: "3rem", fontWeight: 800, color: "white", lineHeight: 1, marginBottom: "0.5rem" }}>0.5s</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "2rem" }}>SENSOR LATENCY</p>
              <button style={{ width: "100%", backgroundColor: "white", color: "#163c24", padding: "1rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.95rem", border: "none", cursor: "pointer" }}>
                Pre-order Sensor Kit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section style={{ display: "flex", justifyContent: "space-around", padding: "4rem", borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", backgroundColor: "white" }}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#163c24", letterSpacing: "-0.03em" }}>4.2M</h3>
          <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>ACRES MONITORED</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#163c24", letterSpacing: "-0.03em" }}>30%</h3>
          <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>WATER SAVED</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#163c24", letterSpacing: "-0.03em" }}>99%</h3>
          <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>AI CONFIDENCE</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "3.5rem", fontWeight: 800, color: "#163c24", letterSpacing: "-0.03em" }}>15k</h3>
          <p style={{ color: "#6b7280", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>GLOBAL FARMS</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "3rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fbfaf8" }}>
        <div>
          <h4 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>AgriNova Terra</h4>
          <p style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 500 }}>© 2024 AGRINOVA TERRA. PRECISION FOR EVERY ACRE.</p>
        </div>
        <div style={{ display: "flex", gap: "2rem" }}>
          <Link href="#" style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>PRIVACY POLICY</Link>
          <Link href="#" style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>TERMS OF SERVICE</Link>
          <Link href="#" style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>SCIENTIFIC METHOD</Link>
          <Link href="#" style={{ color: "#6b7280", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>CONTACT SUPPORT</Link>
        </div>
      </footer>
    </div>
  );
}
