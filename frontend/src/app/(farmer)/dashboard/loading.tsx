export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Navbar skeleton */}
      <div style={{ height: 64, background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }} />

      <main className="page-container" style={{ paddingTop: "2.5rem" }}>
        {/* Welcome section skeleton */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ width: 180, height: 14, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 320, height: 28, background: "var(--bg-muted)", borderRadius: 6, marginBottom: "0.5rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 450, height: 16, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>

        {/* Stats cards skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "2.5rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--border)" }}>
              <div style={{ width: 100, height: 12, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "1rem", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: 60, height: 28, background: "var(--bg-muted)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>

        {/* Chart area skeleton */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2.5rem" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "1.5rem", border: "1px solid var(--border)", height: 280 }}>
              <div style={{ width: 150, height: 16, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "1.5rem", animation: "pulse 1.5s ease-in-out infinite" }} />
              <div style={{ width: "100%", height: 200, background: "var(--bg-muted)", borderRadius: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          ))}
        </div>

        {/* Reports skeleton */}
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ width: 180, height: 20, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "1.25rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ background: "var(--bg-card)", borderRadius: 12, padding: "1.25rem", border: "1px solid var(--border)", height: 120 }}>
                <div style={{ width: "70%", height: 14, background: "var(--bg-muted)", borderRadius: 4, marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ width: "90%", height: 12, background: "var(--bg-muted)", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
              </div>
            ))}
          </div>
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
