import Link from "next/link";
import { Sprout, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div 
      className="page-container animate-fade-in" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "calc(100vh - 80px)" 
      }}
    >
      <div 
        className="card text-center" 
        style={{ 
          maxWidth: "500px", 
          width: "100%", 
          padding: "3.5rem 2rem", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          borderTop: "4px solid var(--primary)"
        }}
      >
        <div 
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "var(--primary-50)",
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1.5rem",
            border: "4px solid var(--primary-100)"
          }}
        >
          <Sprout size={40} color="var(--primary)" />
        </div>
        
        <h1 
          style={{ 
            fontSize: "4rem", 
            fontWeight: "800", 
            lineHeight: "1", 
            color: "var(--primary-800)",
            marginBottom: "0.5rem"
          }}
        >
          404
        </h1>
        
        <h2 className="section-title" style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>
          Off the Beaten Path
        </h2>
        
        <p className="section-subtitle" style={{ maxWidth: "380px", margin: "0 auto 2rem auto" }}>
          We could not find the field you are looking for. It appears this crop hasn't been planted yet, or the data was harvested.
        </p>
        
        <Link href="/" className="btn btn-primary" style={{ width: "100%", maxWidth: "250px" }}>
          <ArrowLeft size={18} />
          Return Home
        </Link>
      </div>
      
      <div style={{ marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        AgriNova Intelligence Engine
      </div>
    </div>
  );
}
