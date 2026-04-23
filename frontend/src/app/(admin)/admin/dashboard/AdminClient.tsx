"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Users, FileText, BarChart3, AlertCircle, Search, Filter, ChevronRight, MapPin, X, CheckCircle2 } from "lucide-react";
import { respondToGrievance } from "./actions";
import { useRouter } from "next/navigation";

export function AdminClient({ farmers, grievances, totalReadings }: { farmers: any[], grievances: any[], totalReadings: number }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"farmers" | "grievances">("farmers");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);
  const router = useRouter();
  
  // Grievance Admin State
  const [activeGrievanceId, setActiveGrievanceId] = useState<string | null>(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [statusDraft, setStatusDraft] = useState<"OPEN" | "IN_PROGRESS" | "RESOLVED">("IN_PROGRESS");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateGrievance = async (grievanceId: string) => {
    setIsUpdating(true);
    await respondToGrievance(grievanceId, statusDraft, adminResponseText);
    setActiveGrievanceId(null);
    setAdminResponseText("");
    setIsUpdating(false);
    router.refresh();
  };

  const filteredFarmers = farmers.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || (f.district && f.district.toLowerCase().includes(search.toLowerCase()));
    
    if (filterType === "ALL") return matchesSearch;
    if (filterType === "ACTIVE_CROP") return matchesSearch && f.primaryCrop;
    if (filterType === "NO_CROP") return matchesSearch && !f.primaryCrop;
    return matchesSearch && f.soilType === filterType;
  });

  const stats = [
    { label: "Total Farmers", value: farmers.length.toString(), icon: <Users size={20} />, color: "var(--primary)" },
    { label: "Total Soil Readings", value: totalReadings.toString(), icon: <FileText size={20} />, color: "var(--accent)" },
    { label: "Network Connectivity", value: "Online", icon: <BarChart3 size={20} />, color: "var(--brown)" },
    { label: "Open Grievances", value: grievances.filter((g) => g.status !== "RESOLVED").length.toString(), icon: <AlertCircle size={20} />, color: "var(--danger)" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar role="ADMIN" userName="Admin" />

      <main className="page-container animate-fade-in">
        <div style={{ marginBottom: "2rem" }}>
          <p className="section-label">ADMIN PANEL</p>
          <h1 className="section-title">System Overview</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {stats.map((stat, i) => (
            <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-md)", background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p className="stat-label">{stat.label}</p>
                <p style={{ fontSize: "1.5rem", fontWeight: 800, color: stat.color }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
          <button
            className={`btn btn-ghost`}
            onClick={() => setActiveTab("farmers")}
            style={{
              borderBottom: activeTab === "farmers" ? "2px solid var(--primary)" : "2px solid transparent",
              borderRadius: 0,
              fontWeight: activeTab === "farmers" ? 700 : 500,
              color: activeTab === "farmers" ? "var(--primary)" : "var(--text-secondary)",
            }}
          >
            Farmer Management
          </button>
          <button
            className={`btn btn-ghost`}
            onClick={() => setActiveTab("grievances")}
            style={{
              borderBottom: activeTab === "grievances" ? "2px solid var(--primary)" : "2px solid transparent",
              borderRadius: 0,
              fontWeight: activeTab === "grievances" ? 700 : 500,
              color: activeTab === "grievances" ? "var(--primary)" : "var(--text-secondary)",
            }}
          >
            Grievances ({grievances.filter((g) => g.status !== "RESOLVED").length})
          </button>
        </div>

        {activeTab === "farmers" && (
          <>
            {/* Search */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input className="form-input" placeholder="Search farmer by name or district..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.5rem" }} />
              </div>
              <select className="form-input" style={{ width: "auto" }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="ALL">All Farmers</option>
                <option value="ACTIVE_CROP">Has Active Crop</option>
                <option value="NO_CROP">No Active Crop</option>
                <option value="BLACK_COTTON">Black Cotton Soil</option>
                <option value="RED">Red Soil</option>
                <option value="ALLUVIAL">Alluvial Soil</option>
                <option value="LATERITE">Laterite Soil</option>
                <option value="SANDY">Sandy Soil</option>
              </select>
            </div>

            {/* Farmer Table */}
            <div className="card" style={{ padding: 0, overflow: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Farmer</th>
                    <th>Location</th>
                    <th>Soil/Irrigation</th>
                    <th>Land (Acres)</th>
                    <th>Total Readings</th>
                    <th>Registered</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} style={{ cursor: "pointer", transition: "background 0.2s" }} onClick={() => setSelectedFarmer(farmer)} onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-muted)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: "0.7rem", display: "flex", justifyContent: "center", alignItems: "center", background: "#f3f4f6", borderRadius: "50%" }}>
                            <span style={{ fontWeight: 700, color: "var(--primary)" }}>{farmer.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p style={{ fontWeight: 600 }}>{farmer.name}</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{farmer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          <MapPin size={14} color="var(--text-muted)" /> {farmer.district || "Unknown"}, {farmer.state || ""}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <span className="badge badge-info" style={{ fontSize: "0.7rem" }}>
                             {farmer.soilType ? farmer.soilType.replace("_", " ") : "NOT SET"}
                          </span>
                        </div>
                      </td>
                      <td>{farmer.landAreaAcres || "-"}</td>
                      <td>{farmer.totalReadings}</td>
                      <td>{farmer.createdAt.split('T')[0]}</td>
                      <td><ChevronRight size={16} color="var(--text-muted)" /></td>
                    </tr>
                  ))}
                  {filteredFarmers.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        No farmers found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Selected Farmer Modal Overlay */}
        {selectedFarmer && (
           <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
             <div className="card animate-slide-up" style={{ width: "100%", maxWidth: "600px", padding: 0, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)", color: "white" }}>
                   <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div className="avatar" style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", color: "white", fontSize: "1.2rem", fontWeight: 800 }}>
                        {selectedFarmer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 800, color: "white" }}>{selectedFarmer.name}</h2>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.85rem", fontWeight: 600 }}>ID: {selectedFarmer.id.substring(0,8).toUpperCase()}</p>
                      </div>
                   </div>
                   <button className="btn-icon" onClick={() => setSelectedFarmer(null)} style={{ color: "white", background: "rgba(0,0,0,0.1)" }}>
                      <X size={20} />
                   </button>
                </div>
                
                {/* Modal Grid Identity Body */}
                <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Primary Contact</p>
                     <p style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       {selectedFarmer.phone}
                     </p>
                   </div>
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Land Area</p>
                     <p style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       {selectedFarmer.landAreaAcres ? `${selectedFarmer.landAreaAcres} Acres` : "Unregistered"}
                     </p>
                   </div>
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Registered District</p>
                     <p style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       {selectedFarmer.district || "Unknown District"}, {selectedFarmer.state || "Unknown State"}
                     </p>
                   </div>
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Farming Soil Type</p>
                     <span className="badge badge-info" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                       {selectedFarmer.soilType ? selectedFarmer.soilType.replace("_", " ") : "NOT EVALUATED"}
                     </span>
                   </div>
                   <div style={{ gridColumn: "1 / -1", height: "1px", background: "var(--border-light)" }} />
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Active Primary Crop</p>
                     <p style={{ fontWeight: 600, color: "var(--primary-dark)", fontSize: "1.1rem" }}>
                       {selectedFarmer.primaryCrop || "Fallow (No Crop Detected)"}
                     </p>
                   </div>
                   <div>
                     <p className="form-label" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Irrigation Strategy</p>
                     <p style={{ fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                       {selectedFarmer.irrigationType || "Rainfed"}
                     </p>
                   </div>
                </div>
                
                {/* Modal Footer Controls */}
                <div style={{ background: "var(--bg-muted)", padding: "1.5rem 2rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-outline" onClick={() => setSelectedFarmer(null)}>Close Profile</button>
                </div>
             </div>
           </div>
        )}

        {activeTab === "grievances" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {grievances.map((grievance) => (
              <div key={grievance.id} className="card animate-slide-up" style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1.25rem",
                padding: "1.5rem",
                borderTop: grievance.status === "RESOLVED" ? "4px solid var(--success)" : grievance.status === "IN_PROGRESS" ? "4px solid var(--warning)" : "4px solid var(--danger)",
                transition: "box-shadow 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                      <h4 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{grievance.title}</h4>
                      <span className={`badge ${
                        grievance.status === "OPEN" ? "badge-danger" :
                        grievance.status === "IN_PROGRESS" ? "badge-warning" : "badge-success"
                      }`} style={{ fontWeight: 700, letterSpacing: "0.02em" }}>
                        {grievance.status.replace("_", " ")}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
                      {grievance.description}
                    </p>
                    <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
                        <Users size={14} color="var(--primary)" /> By {grievance.farmer?.name}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        #{grievance.id.substring(0, 8).toUpperCase()} • {grievance.createdAt.split('T')[0]}
                      </span>
                    </div>
                  </div>
                  
                  {activeGrievanceId !== grievance.id ? (
                     <button 
                       className="btn btn-outline btn-sm" 
                       onClick={() => {
                          setActiveGrievanceId(grievance.id);
                          setAdminResponseText(grievance.adminResponse || "");
                          setStatusDraft(grievance.status);
                       }}
                     >
                       {grievance.status === "RESOLVED" ? "Edit" : "Respond"}
                     </button>
                  ) : (
                     <button className="btn-icon btn-ghost" onClick={() => setActiveGrievanceId(null)}>
                       <X size={20} />
                     </button>
                  )}
                </div>
                
                {/* Expandable Admin Response Editor */}
                {activeGrievanceId === grievance.id && (
                  <div style={{ background: "rgba(22, 163, 74, 0.04)", padding: "1.75rem", borderRadius: "12px", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem", border: "1px dashed var(--primary-200)" }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem" }}>Update Ticket Status</label>
                      <select 
                        className="form-input" 
                        value={statusDraft} 
                        onChange={(e) => setStatusDraft(e.target.value as any)}
                        style={{ 
                          background: "#f9fafb", 
                          border: "1px solid #e5e7eb", 
                          borderRadius: "8px",
                          padding: "1rem",
                          fontSize: "0.95rem",
                          width: "100%",
                          maxWidth: "300px" 
                        }}
                      >
                        <option value="OPEN">Open (Unresolved)</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.85rem" }}>Official Admin Response</label>
                      <textarea
                        className="form-textarea"
                        rows={6}
                        placeholder="Draft your formal solution or response here to dispatch directly to the farmer..."
                        value={adminResponseText}
                        onChange={(e) => setAdminResponseText(e.target.value)}
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
                    
                    <button 
                      className="btn btn-primary" 
                      disabled={isUpdating} 
                      onClick={() => handleUpdateGrievance(grievance.id)}
                      style={{ alignSelf: "flex-end" }}
                    >
                      {isUpdating ? "Saving..." : <><CheckCircle2 size={16} /> Update Grievance Ticket</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {grievances.length === 0 && (
              <div className="card" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                No active grievances currently logged in the system.
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
