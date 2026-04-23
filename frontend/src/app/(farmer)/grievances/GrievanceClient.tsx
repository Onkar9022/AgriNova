"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { grievanceSchema, GrievanceFormData } from "@/lib/validators";
import { submitGrievance } from "./actions";
import { AlertCircle, CheckCircle2, Clock, MessageSquare, Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GrievanceClient({ historicalGrievances }: { historicalGrievances: any[] }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GrievanceFormData>({
    resolver: zodResolver(grievanceSchema),
  });

  const router = useRouter();

  const onSubmit = async (data: GrievanceFormData) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const result = await submitGrievance(data);

    if (result.success) {
      setSuccessMessage("Your grievance has been securely submitted to the advisory board.");
      reset();
      router.refresh();
    } else {
      setErrorMessage(result.error || "Failed to submit grievance");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2.5rem", padding: "1rem" }}>
      
      {/* Back Button */}
      <div style={{ marginBottom: "-1.5rem" }}>
        <button 
          onClick={() => router.push("/dashboard")}
          className="btn btn-ghost" 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", color: "var(--text-secondary)", fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
      </div>

      {/* Header with gradient and glass effect */}
      <div style={{
        background: "linear-gradient(135deg, rgba(22, 163, 74, 0.1) 0%, rgba(22, 163, 74, 0.02) 100%)",
        border: "1px solid rgba(22, 163, 74, 0.2)",
        borderRadius: "var(--radius-xl)",
        padding: "2rem",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "300px", height: "300px", background: "rgba(22, 163, 74, 0.1)", borderRadius: "50%", filter: "blur(50px)" }} />
        <p className="section-label" style={{ marginBottom: "0.5rem" }}>FARMER SUPPORT</p>
        <h1 className="section-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Grievance Portal</h1>
        <p className="section-subtitle" style={{ maxWidth: "600px", color: "var(--text-secondary)" }}>
          Log any issues with sensor hardware, ML recommendations, or general agronomy queries. 
          Our administration team responds within 24 hours.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", alignItems: "start" }}>
        {/* Left Col: Submission Form */}
        <div className="card" style={{ 
          borderTop: "4px solid var(--primary)", 
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-primary)" }}>
            <div style={{ background: "var(--primary-100)", padding: "0.5rem", borderRadius: "8px", color: "var(--primary)" }}>
              <MessageSquare size={20} />
            </div>
            Submit New Ticket
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {successMessage && (
              <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                <CheckCircle2 size={18} />
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                <AlertCircle size={18} />
                {errorMessage}
              </div>
            )}

            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Grievance Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of the issue..."
                style={{ background: "var(--bg-muted)", border: "1px solid transparent", transition: "all 0.2s" }}
                {...register("title")}
              />
              {errors.title && <p className="form-error" style={{ marginTop: "0.25rem" }}>{errors.title.message}</p>}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "0.5rem" }}>Detailed Description</label>
              <textarea
                className="form-textarea"
                rows={6}
                placeholder="Explain the anomaly or issue you are facing in detail..."
                style={{ 
                  background: "#f9fafb", 
                  border: "1px solid #e5e7eb", 
                  borderRadius: "8px",
                  padding: "1rem",
                  fontSize: "0.95rem",
                  width: "100%",
                  resize: "vertical" 
                }}
                {...register("description")}
              />
              {errors.description && <p className="form-error" style={{ marginTop: "0.4rem" }}>{errors.description.message}</p>}
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ 
              marginTop: "0.5rem", 
              padding: "0.8rem", 
              fontSize: "1rem", 
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(22, 163, 74, 0.2)"
            }}>
              {isSubmitting ? "Submitting securely..." : <><Send size={18} /> Dispatch to Admin</>}
            </button>
          </form>
        </div>

        {/* Right Col: Tracking history */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, marginBottom: "0.25rem", color: "var(--text-primary)" }}>
            Ticket Tracking View
          </h2>
          
          {historicalGrievances.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-muted)", border: "2px dashed var(--border)", boxShadow: "none" }}>
              <CheckCircle2 size={48} style={{ margin: "0 auto 1rem", opacity: 0.2, color: "var(--primary)" }} />
              <p style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "1.1rem" }}>All Systems Nominal</p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>You have no active grievances logged.</p>
            </div>
          ) : (
            historicalGrievances.map((g) => (
              <div key={g.id} className="card animate-slide-up" style={{ 
                borderLeft: g.status === "RESOLVED" ? "4px solid var(--success)" : g.status === "IN_PROGRESS" ? "4px solid var(--warning)" : "4px solid var(--danger)",
                padding: "1.5rem",
                transition: "transform 0.2s ease",
                cursor: "default"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "1rem", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{g.title}</h3>
                  <span className={`badge ${
                      g.status === "OPEN" ? "badge-danger" :
                      g.status === "IN_PROGRESS" ? "badge-warning" : "badge-success"
                    }`} style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem", display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 700, letterSpacing: "0.02em" }}>
                    {g.status === "IN_PROGRESS" && <Clock size={12} />}
                    {g.status.replace("_", " ")}
                  </span>
                </div>
                
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {g.description}
                </p>

                {g.adminResponse && (
                  <div style={{ 
                    background: "var(--bg-muted)", 
                    padding: "1.25rem", 
                    borderRadius: "12px", 
                    border: "1px solid var(--border)",
                    borderLeft: "4px solid var(--primary)", 
                    marginTop: "1.25rem",
                    boxShadow: "var(--shadow-sm)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={{ background: "var(--primary-100)", padding: "0.3rem", borderRadius: "50%", display: "flex" }}>
                        <CheckCircle2 size={16} color="var(--primary)" />
                      </div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Official Admin Response</p>
                    </div>
                    <p style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{g.adminResponse}</p>
                  </div>
                )}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "0.5rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    TICKET ID: #{g.id.substring(0, 8).toUpperCase()}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    {g.createdAt.split('T')[0]}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
