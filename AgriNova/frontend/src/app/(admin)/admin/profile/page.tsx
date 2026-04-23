import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User, Shield, KeyRound, Mail, Clock } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch admin stats directly securely
  const adminProfile = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });

  return (
    <div className="page-container animate-fade-in" style={{ padding: "2rem" }}>
      <div style={{ marginBottom: "2.5rem" }}>
        <p className="section-label" style={{ color: "var(--primary)" }}>SECURITY CLEARANCE</p>
        <h1 className="section-title">Administrator Profile</h1>
        <p className="section-subtitle">
          Manage your system-level access and security settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", alignItems: "start" }}>
        
        {/* Left Column: Identity Panel */}
        <div className="card" style={{ 
          borderTop: "4px solid var(--primary)", 
          boxShadow: "var(--shadow-md)",
          padding: "2rem" 
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "2rem", marginBottom: "2rem" }}>
            <div style={{ 
              width: "80px", 
              height: "80px", 
              background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", 
              borderRadius: "50%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              boxShadow: "0 8px 16px rgba(22, 163, 74, 0.2)",
              marginBottom: "1.5rem"
            }}>
              <Shield size={36} color="white" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>{session.user.name}</h2>
            <span style={{ 
              background: "rgba(22, 163, 74, 0.1)", 
              color: "var(--primary)", 
              padding: "0.4rem 1rem", 
              borderRadius: "2rem", 
              fontSize: "0.75rem", 
              fontWeight: 700, 
              marginTop: "0.75rem",
              letterSpacing: "0.05em",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem"
            }}><KeyRound size={14} /> LEVEL 5 SYSTEM ADMIN</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "var(--bg-muted)", padding: "0.5rem", borderRadius: "8px" }}><User size={18} color="var(--text-secondary)" /></div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>System Name</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{adminProfile?.name}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "var(--bg-muted)", padding: "0.5rem", borderRadius: "8px" }}><Mail size={18} color="var(--text-secondary)" /></div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Root Email</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{adminProfile?.email}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "var(--bg-muted)", padding: "0.5rem", borderRadius: "8px" }}><Clock size={18} color="var(--text-secondary)" /></div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", margin: 0 }}>Role Authorized Since</p>
                <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{adminProfile?.createdAt ? adminProfile.createdAt.toISOString().split("T")[0] : "System Genesis"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Data */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "2rem" }}>
             <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>Global Statistics</h3>
             <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Your administrative data footprint running across the platform arrays.</p>
             
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>24</p>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Total Audits</p>
                </div>
                <div style={{ background: "#f9fafb", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <p style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)", margin: 0 }}>Active</p>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", margin: 0 }}>Firewall Core</p>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
