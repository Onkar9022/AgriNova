"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, User, MapPin } from "lucide-react";

export default function ProfileForm({ initialData }: { initialData: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: initialData.name || "",
    state: initialData.state || "",
    district: initialData.district || "",
    taluka: initialData.taluka || "",
    landAreaAcres: initialData.landAreaAcres || "",
    primaryCrop: initialData.primaryCrop || "",
    irrigationType: initialData.irrigationType || "DRIP",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh(); // forces root layout UI to observe the new crop globally
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
       
      <div>
         <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <User size={18} color="var(--primary)" /> Personal Information
         </h3>
         <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handleChange} required />
         </div>
      </div>

      <div style={{ height: "1px", background: "var(--border)", margin: "0.5rem 0" }} />

      <div>
         <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <MapPin size={18} color="var(--primary)" /> Geographic & Farm Setup
         </h3>
         
         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" name="state" value={form.state} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label className="form-label">District</label>
                <input className="form-input" name="district" value={form.district} onChange={handleChange} />
            </div>
         </div>

         <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Taluka / Sub-District</label>
            <input className="form-input" name="taluka" value={form.taluka} onChange={handleChange} />
         </div>

         <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
                <label className="form-label">Primary Crop Currently Active</label>
                <input className="form-input" name="primaryCrop" value={form.primaryCrop} onChange={handleChange} placeholder="e.g. Rice, Wheat, Cotton" />
            </div>
            <div className="form-group">
                <label className="form-label">Total Land Area (Acres)</label>
                <input className="form-input" type="number" step="0.1" name="landAreaAcres" value={form.landAreaAcres} onChange={handleChange} />
            </div>
         </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
         {success && <span style={{ color: "var(--success)", fontWeight: 500 }}>Profile saved successfully!</span>}
         <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
         </button>
      </div>

    </form>
  );
}
