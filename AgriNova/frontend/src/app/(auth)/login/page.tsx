"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        // Fetch session to determine role-based redirect
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        if (session?.user?.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", backgroundColor: "#f6f6f2", padding: "1.5rem" }}>
      
      {/* Left Panel - Branding */}
      <div 
        style={{ 
          backgroundColor: "#163c24", // Dark green from mockup
          borderRadius: "24px",
          position: "relative",
          overflow: "hidden",
          color: "white",
          display: "flex",
          flexDirection: "column",
          padding: "4rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "auto" }}>
          <Leaf size={28} color="#a3e635" />
          <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>AgriNova</span>
        </div>

        <div style={{ zIndex: 10, marginTop: "2rem", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "4.5rem", lineHeight: 1.1, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: "1.5rem" }}>
            The Future of <br />
            <span style={{ color: "#a3e635" }}>Agronomy</span> is <br />
            Digital.
          </h1>
          <p style={{ fontSize: "1.25rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: "460px" }}>
            Precision data meet premium insights. Log in to manage your yields with scientific accuracy.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "auto" }}>
          <img 
            src="/farmer_placeholder.jpg" 
            alt="Farmers" 
            style={{ width: "120px", height: "40px", borderRadius: "20px", objectFit: "cover", background: "#ffffff30" }}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.95rem" }}>
            Join 4,000+ modern agronomists
          </span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <div style={{ marginBottom: "2.5rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#111827", marginBottom: "0.5rem" }}>
              Welcome Back
            </h2>
            <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>
              Access your digital agronomist dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#4b5563", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Mobile Number or Email
              </label>
              <input
                type="text"
                required
                placeholder="+91 00000 00000 or farmer@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{
                  width: "100%", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e5e7eb",
                  background: "#f9fafb", fontSize: "1rem", outline: "none", transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#8b4513"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.05em", color: "#4b5563", textTransform: "uppercase" }}>
                  Password
                </label>
                <Link href="#" style={{ fontSize: "0.85rem", color: "#111827", fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e5e7eb",
                    background: "#f9fafb", fontSize: "1rem", outline: "none", transition: "border-color 0.2s", paddingRight: "3rem"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8b4513"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280" }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
              <input type="checkbox" id="remember" style={{ width: "16px", height: "16px", accentColor: "#8b4513", cursor: "pointer" }} />
              <label htmlFor="remember" style={{ fontSize: "0.95rem", color: "#4b5563", cursor: "pointer" }}>
                Remember me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "1rem", borderRadius: "12px", background: "#8b4513", color: "white",
                fontSize: "1rem", fontWeight: 700, border: "none", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#70360f"}
              onMouseOut={(e) => e.currentTarget.style.background = "#8b4513"}
            >
              {loading ? "Verifying..." : <>Sign In to Dashboard <ArrowRight size={18} /></>}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginTop: "3rem", padding: "1rem", background: "#fdfbf7", borderRadius: "12px", border: "1px solid #f1e5d1" }}>
            <div style={{ background: "#f1e5d1", padding: "0.5rem", borderRadius: "8px" }}>
              <Shield size={20} color="#8b4513" />
            </div>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", marginBottom: "0.25rem" }}>Secure Entry Protocol</h4>
              <p style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.5 }}>
                Your data is encrypted using military-grade AES-256 protocols to ensure harvest integrity.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
              Don&apos;t have an account? <Link href="/register" style={{ color: "#111827", fontWeight: 700 }}>Register Here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
