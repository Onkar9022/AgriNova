import Link from "next/link";
import { Globe, CheckCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-grid">
        <div>
          <p style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
            AgriNova
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Empowering farmers through data science and localized agronomical intelligence.
          </p>
        </div>

        <div>
          <h4 className="footer-heading">Support</h4>
          <Link href="#" className="footer-link">Contact Support</Link>
          <Link href="#" className="footer-link" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            Status: All Systems Operational
          </Link>
        </div>

        <div>
          <h4 className="footer-heading">Legal</h4>
          <Link href="#" className="footer-link">Privacy Policy</Link>
          <Link href="#" className="footer-link">Terms of Service</Link>
        </div>

        <div>
          <h4 className="footer-heading">Connect</h4>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <Globe size={18} color="var(--text-secondary)" />
            <CheckCircle size={18} color="var(--primary)" />
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--border)", marginTop: "1.5rem", paddingTop: "1rem" }}>
        <p className="footer-copyright">
          © {new Date().getFullYear()} AgriNova Digital Agronomist. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
