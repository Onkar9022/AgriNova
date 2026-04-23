"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Send, BellRing, Target, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { broadcastNotification } from "./actions";
import { useRouter } from "next/navigation";

export function AdminNotificationClient({ farmers, history }: { farmers: any[], history: any[] }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"INFO" | "SUCCESS" | "WARNING">("INFO");
  const [targetId, setTargetId] = useState<string>("GLOBAL");
  
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleDispatch = async (e: any) => {
     e.preventDefault();
     setIsSending(true);
     setSuccessMsg("");

     const res = await broadcastNotification(title, message, type, targetId === "GLOBAL" ? undefined : targetId);
     if (res.success) {
        setSuccessMsg("System Alert dispatched successfully.");
        setTitle("");
        setMessage("");
        router.refresh();
     }
     setIsSending(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar role="ADMIN" userName="Admin" />

      <main className="page-container animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <p className="section-label">ADMIN COMMUNICATIONS</p>
          <h1 className="section-title">Broadcast Center</h1>
          <p className="section-subtitle">Dispatch platform-wide alerts or target specific farmer terminals.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "3rem", alignItems: "start" }}>
           
           {/* Composer Form */}
           <div className="card" style={{ borderTop: "4px solid var(--primary)", padding: "2.5rem", boxShadow: "var(--shadow-md)" }}>
             <h2 style={{ fontSize: "1.35rem", fontWeight: 800, marginBottom: "2rem", display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-primary)" }}>
               <BellRing color="var(--primary)" size={24} /> Alert Composer
             </h2>
             
             <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
               {successMsg && (
                 <div style={{ padding: "1rem", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                   <CheckCircle2 size={18} />
                   {successMsg}
                 </div>
               )}

               <div>
                 <label className="form-label" style={{ fontWeight: 600 }}>Dispatch Target</label>
                 <select className="form-input" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                   <option value="GLOBAL">🌍 Global Broadcast (All Farmers)</option>
                   <optgroup label="Direct Message Node">
                     {farmers.map(f => (
                        <option key={f.id} value={f.id}>Farmer: {f.name} ({f.phone})</option>
                     ))}
                   </optgroup>
                 </select>
               </div>

               <div>
                 <label className="form-label" style={{ fontWeight: 600 }}>Priority Status</label>
                 <select className="form-input" value={type} onChange={(e) => setType(e.target.value as any)}>
                   <option value="INFO">Information (Blue)</option>
                   <option value="SUCCESS">Success Update (Green)</option>
                   <option value="WARNING">Critical Warning (Red)</option>
                 </select>
               </div>

               <div>
                 <label className="form-label" style={{ fontWeight: 600 }}>Alert Envelope Title</label>
                 <input className="form-input" required placeholder="e.g. Weather Advisory: Heavy Rains Expected" value={title} onChange={(e) => setTitle(e.target.value)} />
               </div>

               <div>
                 <label className="form-label" style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem" }}>Transmission Package (Message body)</label>
                 <textarea 
                   className="form-textarea" 
                   rows={6} 
                   required 
                   placeholder="Detailed system event parameters..." 
                   value={message} 
                   onChange={(e) => setMessage(e.target.value)} 
                   style={{ 
                     background: "#f9fafb", 
                     border: "1px solid #e5e7eb", 
                     borderRadius: "8px",
                     padding: "1rem",
                     fontSize: "0.95rem",
                     width: "100%",
                     resize: "vertical" 
                   }}
                 />
               </div>

               <button type="submit" className="btn btn-primary" disabled={isSending} style={{ padding: "0.8rem", fontSize: "1rem", fontWeight: 700 }}>
                 {isSending ? "Authenticating & Dispatching..." : <><Send size={18} /> Dispatch Notification Protocol</>}
               </button>
             </form>
           </div>

           {/* History Tab */}
           <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
             <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>Recent System Dispatches</h2>
             
             {history.length === 0 ? (
                <div className="card" style={{ padding: "3rem", textAlign: "center", background: "var(--bg-muted)" }}>
                  <ShieldAlert size={40} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
                  <p style={{ fontWeight: 600, color: "var(--text-secondary)" }}>Data Vacuum</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No notifications have been dispatched on this array yet.</p>
                </div>
             ) : (
                history.map(item => (
                   <div key={item.id} className="card animate-slide-up" style={{ 
                      padding: "1.5rem", 
                      borderLeft: item.type === "WARNING" ? "4px solid var(--danger)" : item.type === "SUCCESS" ? "4px solid var(--success)" : "4px solid var(--info)"
                   }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                         <h4 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{item.title}</h4>
                         <span className={`badge`} style={{ 
                            background: item.userId ? "var(--accent-100)" : "var(--primary-100)", 
                            color: item.userId ? "var(--accent)" : "var(--primary)",
                            fontSize: "0.7rem", 
                            fontWeight: 800 
                         }}>
                            {item.userId ? "TARGETED" : "GLOBAL"}
                         </span>
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{item.message}</p>
                      
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                           <Target size={12} /> {item.user?.name || "ALL USERS"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                           {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                   </div>
                ))
             )}
           </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
