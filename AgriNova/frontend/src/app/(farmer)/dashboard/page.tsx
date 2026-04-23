import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SoilTrendChart from "@/components/charts/SoilTrendLine";
import PHHistoryChart from "@/components/charts/PHHistoryLine";
import SoilHealthScore from "@/components/charts/SoilHealthScore";
import LiveLocation from "@/components/layout/LiveLocation";
import AiInsight from "@/components/ai/AiInsight";
import { Beaker, Leaf, MapPin, ArrowRight, CloudRain, ThermometerSun, Calendar as CalIcon } from "lucide-react";

async function getPlaceName(lat: number | null, lng: number | null) {
  if (!lat || !lng) return "Local Farm";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { next: { revalidate: 86400 } });
    if (res.ok) {
      const data = await res.json();
      return data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Local Farm";
    }
  } catch(e) {}
  return "Local Farm";
}

export default async function DashboardPage() {
  // 1. Fetch Session
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  let user: any;
  let soilReadings: any[] = [];

  // Greeting (time-based)
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour >= 5 && hour < 12) greeting = "Good Morning";
  else if (hour >= 12 && hour < 18) greeting = "Good Afternoon";
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  try {
    // 2. Fetch Live User Profile via Prisma
    user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      redirect("/login");
    }

    // 3. Fetch latest soil readings
    soilReadings = await prisma.soilReading.findMany({
      where: { farmerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        prediction: true,
    }
  });

  const latestReading = soilReadings.length > 0 ? soilReadings[0] : null;
  const latestPrediction = latestReading?.prediction;

  const reports = soilReadings.slice(0, 3).map((reading) => {
    return {
      id: reading.id,
      date: new Date(reading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      title: reading.plantedCropName ? `${reading.plantedCropName} Assessment` : "Pre-Planting Analysis",
      summary: reading.prediction?.fertilizerName 
        ? `Growth Phase analysis mapped. Adjusting targeted nutrients.` 
        : `Baseline analysis logged.`,
      icon: reading.plantedCropName ? "🌱" : "🧪"
    };
  });

  // Map historical graphs backwards
  const trendData = soilReadings.slice().reverse().map(reading => ({
    month: new Date(reading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
    N: reading.nitrogenN,
    P: reading.phosphorusP,
    K: reading.potassiumK
  }));

  const phData = soilReadings.slice().reverse().map(reading => ({
    month: new Date(reading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase(),
    ph: reading.ph
  }));

  // Derived properties for UI
  const calculateSoilScore = (reading: any) => {
    if (!reading) return 0;
    let score = 100;
    // pH: optimal 6.5-7.5
    if (reading.ph < 6.0 || reading.ph > 8.0) score -= 20;
    else if (reading.ph < 6.5 || reading.ph > 7.5) score -= 10;
    // Macronutrients
    if (reading.nitrogenN < 40 || reading.nitrogenN > 150) score -= 10;
    if (reading.phosphorusP < 20 || reading.phosphorusP > 80) score -= 10;
    if (reading.potassiumK < 20 || reading.potassiumK > 80) score -= 10;
    // Moisture: optimal 20-60%
    if (reading.moisture != null) {
      if (reading.moisture < 10 || reading.moisture > 80) score -= 15;
      else if (reading.moisture < 20 || reading.moisture > 60) score -= 5;
    }
    // EC: optimal 200-1200 µS/cm
    if (reading.ec != null && reading.ec > 0) {
      if (reading.ec > 4000) score -= 15; // saline
      else if (reading.ec > 2000) score -= 10;
      else if (reading.ec < 100) score -= 5;
    }
    // Soil temperature: optimal 15-35°C
    if (reading.temperatureSoil != null) {
      if (reading.temperatureSoil < 5 || reading.temperatureSoil > 45) score -= 10;
      else if (reading.temperatureSoil < 15 || reading.temperatureSoil > 35) score -= 5;
    }
    return Math.max(0, Math.min(100, score));
  };
  const latestScore = calculateSoilScore(latestReading);

  const displayCrop = user.primaryCrop || latestReading?.plantedCropName || "Unassigned";
  const displayLandArea = user.landAreaAcres || 0;
  
  const welcomeMessage = latestReading 
    ? `Your latest reading for ${displayCrop} shows pH levels at ${latestReading.ph.toFixed(1)}.`
    : "You haven't run any soil analyses yet. Click Start New Soil Analysis to begin.";

  const latestRecommendation = latestPrediction?.fertilizerName 
    ? `Apply ${latestPrediction.fertilizerName}`
    : "Awaiting Analysis";

  const placeName = await getPlaceName(user.gpsLat, user.gpsLng);
  const airTemp = latestReading?.airTemp ? `${latestReading.airTemp.toFixed(1)}°C` : "N/A";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar userName={user.name} role={user.role} />



      <main className="page-container animate-fade-in" style={{ paddingTop: "2.5rem" }}>
        {/* Welcome Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            <p className="section-label">THE DIGITAL AGRONOMIST</p>
            <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>
              {greeting}, {user.name.split(" ")[0]}.
            </h1>
            <p className="section-subtitle">{welcomeMessage}</p>
          </div>
          <Link href="/soil-analysis" className="btn btn-primary btn-lg" id="start-soil-analysis-btn">
            <Beaker size={18} />
            Start New Soil Analysis
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid-3" style={{ marginBottom: "2.5rem" }}>
          {/* Latest Recommendation */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <Beaker size={20} color="var(--primary)" />
              {latestReading && (
                <span className="badge badge-success">
                  VERIFIED {new Date(latestReading.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                </span>
              )}
            </div>
            
            <p className="stat-label" style={{ marginBottom: "0.25rem" }}>Latest Recommendation</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--primary)", marginBottom: "0.75rem" }}>
              {latestRecommendation}
            </p>

            {/* Environmental Inject Center */}
            <div style={{ padding: "0.5rem 0.75rem", background: "var(--bg-muted)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500 }}>
                    <CalIcon size={14} /> {currentDate}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ThermometerSun size={14} /> {airTemp} Local</span>
                    <LiveLocation />
                </div>
            </div>
          </div>

          {/* Active Crop */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <Leaf size={20} color="var(--accent)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {latestPrediction?.growthStage ? String(latestPrediction.growthStage) : "ACTIVE"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
               <p className="stat-label">Active Crop</p>
               <Link href="/profile" style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                  (Edit)
               </Link>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
              <p style={{ fontSize: "1.1rem", fontWeight: 700 }}>{displayCrop}</p>
              {latestPrediction?.daysSincePlanting && (
                <p className="stat-value">{latestPrediction.daysSincePlanting} Days</p>
              )}
            </div>
            <div className="progress-bar" style={{ marginTop: "0.75rem" }}>
              <div className="progress-fill progress-fill-warning" style={{ width: latestPrediction?.daysSincePlanting ? `${Math.min((latestPrediction.daysSincePlanting / 120) * 100, 100)}%` : "0%" }} />
            </div>
          </div>

          {/* Farm Area */}
          <div className="card card-brown">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <MapPin size={20} color="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                LOCATION: {user.taluka || user.district || "UNMAPPED"}
              </span>
            </div>
            <p className="card-label" style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>Total Farm Area</p>
            <p className="stat-value" style={{ color: "white" }}>
              {displayLandArea} <span style={{ fontSize: "1rem", fontWeight: 500 }}>Acres</span>
            </p>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {/* Soil Health Trends */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem" }}>Soil Health Trends</h3>
              <div style={{ display: "flex", gap: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)" }} /> N
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} /> P
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--brown)" }} /> K
                </span>
              </div>
            </div>
            <SoilTrendChart data={trendData} />
          </div>

          {/* pH Balance */}
          <div className="card" style={{ padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>pH Balance</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Stable within target range.
            </p>
            <PHHistoryChart data={phData} />
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Current</span>
              <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>{latestReading ? latestReading.ph.toFixed(1) : "N/A"}</span>
            </div>
          </div>
          
          {/* Composite Soil Health Score */}
          <div className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>System Health</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              Aggregated agronomic potential score.
            </p>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
              <SoilHealthScore score={latestScore} />
            </div>
          </div>
        </div>

        {/* AI Soil Insight */}
        {latestReading && (
          <div style={{ marginBottom: "2.5rem" }}>
            <AiInsight
              type="soil_health"
              data={{
                ph: latestReading.ph,
                n: latestReading.nitrogenN,
                p: latestReading.phosphorusP,
                k: latestReading.potassiumK,
                moisture: latestReading.moisture,
                ec: latestReading.ec || 0,
                soilTemp: latestReading.soilTemp || 0,
              }}
              title="✨ Ask AI — Analyze my soil health"
            />
          </div>
        )}

        {/* Recent Soil Reports */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.25rem" }}>Recent Soil Reports</h3>
            {reports.length > 0 && (
              <Link href="/history" style={{ fontSize: "0.9rem", color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500 }}>
                View All Records
              </Link>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ color: "var(--text-secondary)" }}>No soil analyses found.</p>
              <Link href="/soil-analysis" className="btn btn-outline" style={{ marginTop: "1rem" }}>Run First Analysis</Link>
            </div>
          ) : (
            <div className="grid-3">
              {reports.map((report) => (
                <div key={report.id} className="card" style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }}>
                      {report.icon}
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                      {report.date}
                    </span>
                  </div>
                  <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{report.title}</h4>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "1rem" }}>
                    {report.summary}
                  </p>
                  <Link href={`/history`} style={{ fontSize: "0.85rem", color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    Full Report <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );

  } catch (error: any) {
    console.error("Dashboard DB error:", error.message);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar userName="Farmer" />
        <main className="page-container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ textAlign: "center", padding: "3rem", maxWidth: "500px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ marginBottom: "0.75rem" }}>Service Temporarily Unavailable</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              We couldn&apos;t reach the database. This is usually a temporary network issue. Please try again in a moment.
            </p>
            <a href="/dashboard" className="btn btn-primary">Retry</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
}
