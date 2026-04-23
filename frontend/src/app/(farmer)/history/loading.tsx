export default function HistoryLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar skeleton */}
      <div style={{ height: 64, background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }} />

      <main className="page-container" style={{ paddingTop: "2.5rem" }}>
        {/* Header skeleton */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ width: 160, height: 14, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 280, height: 28, background: "var(--bg-muted)", borderRadius: 6, marginBottom: "0.5rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 400, height: 16, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        {/* Search bar skeleton */}
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, height: 44, background: "var(--bg-muted)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 100, height: 44, background: "var(--bg-muted)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        {/* Table skeleton */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr 1fr", gap: "1rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
            {["Date", "Crop", "Recommendation", "NPK / pH", "Actions"].map((h) => (
              <div key={h} style={{ width: "70%", height: 12, background: "var(--border)", borderRadius: 4 }} />
            ))}
          </div>
          {/* Data rows */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.5fr 1fr", gap: "1rem", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: "60%", height: 14, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "50%", height: 14, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "70%", height: 14, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "80%", height: 14, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "90px", height: 32, background: "var(--bg-muted)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
