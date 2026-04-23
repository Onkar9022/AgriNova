import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Search, Filter, Download, RotateCcw } from "lucide-react";
import Link from "next/link";
import DeleteRecordButton from "./DeleteRecordButton";
import FeedbackForm from "./FeedbackForm";

export default async function HistoryPage({ searchParams }: { searchParams: any }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  try {
    const resolvedParams = await searchParams;
    const query = resolvedParams.q || "";

    // Fetch true history from Prisma
    const soilReadings = await prisma.soilReading.findMany({
      where: { farmerId: session.user.id },
      include: { prediction: { include: { feedbacks: true } } },
      orderBy: { createdAt: "desc" }
    });

    // Filter based on query
    const filtered = soilReadings.filter((reading) => {
      const crop = reading.plantedCropName || reading.prediction?.cropRank1 || "";
      const dateStr = new Date(reading.createdAt).toISOString();
      return crop.toLowerCase().includes(query.toLowerCase()) || dateStr.includes(query);
    });

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />

        <main className="page-container animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
            <div>
              <p className="section-label">ANALYSIS ARCHIVE</p>
              <h1 className="section-title">Soil Reading History</h1>
              <p className="section-subtitle">
                Detailed archiving of every analysis logged to your farm.
              </p>
            </div>
          </div>

          {/* Search & Filter via Server Form GET */}
          <form action="/history" method="GET" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                name="q"
                className="form-input"
                placeholder="Search by crop name..."
                defaultValue={query}
                style={{ paddingLeft: "2.5rem" }}
                id="history-search"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Crop Context</th>
                  <th>Recommendation</th>
                  <th>NPK / pH</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const targetCrop = item.plantedCropName || item.prediction?.cropRank1 || "Unknown";
                  const fert = item.prediction?.fertilizerName || "Processing";
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                          {targetCrop}
                        </span>
                        {item.cropPlanted && (
                          <span className="badge badge-warning" style={{ marginLeft: "0.5rem" }}>PLANTED</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{fert}</span>
                      </td>
                      <td>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                          {item.nitrogenN} / {item.phosphorusP} / {item.potassiumK} • pH: {item.ph}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          <Link 
                            href={`/results?id=${item.id}`}
                            className="btn btn-outline btn-sm"
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", textDecoration: "none" }}
                          >
                            View Full Report
                          </Link>
                          <DeleteRecordButton id={item.id} />
                        </div>
                        {item.prediction && 
                         item.prediction.feedbacks.length === 0 && 
                         (Date.now() - new Date(item.createdAt).getTime() > 14 * 24 * 60 * 60 * 1000) && (
                          <FeedbackForm 
                            predictionId={item.prediction.id} 
                            recommendedCrop={targetCrop} 
                          />
                        )}
                        {item.prediction && item.prediction.feedbacks.length > 0 && (
                          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--success)" }}>
                            Feedback provided
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No records found.
            </div>
          )}
        </main>

        <Footer />
      </div>
    );
  } catch (error: any) {
    console.error("History page DB error:", error.message);
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main className="page-container" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="card" style={{ textAlign: "center", padding: "3rem", maxWidth: "500px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ marginBottom: "0.75rem" }}>Service Temporarily Unavailable</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              We couldn&apos;t load your history. This is usually a temporary network issue.
            </p>
            <a href="/history" className="btn btn-primary">Retry</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
}

