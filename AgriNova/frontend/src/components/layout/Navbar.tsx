"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, Settings, LogOut, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getNotifications } from "@/app/actions/notifications";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

interface NavbarProps {
  userName?: string;
  role?: string;
}

export default function Navbar({ userName = "Farmer", role = "FARMER" }: NavbarProps) {
  const pathname = usePathname();
  const [displayName, setDisplayName] = useState(userName);
  
  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasViewedNotifications, setHasViewedNotifications] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data?.user?.name) {
          setDisplayName(data.user.name);
        }
      })
      .catch(() => {});
      
    // Poll notifications aggressively on mount without blocking the critical render path
    getNotifications().then(res => {
       if (res.success) {
          setNotifications(res.data);
       }
    }).catch(console.error);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const farmerLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/soil-analysis", label: "Soil Analysis" },
    { href: "/history", label: "History" },
    { href: "/grievances", label: "Grievances" },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "User Management" },
    { href: "/admin/notifications", label: "Broadcast Center" },
  ];

  const links = role === "ADMIN" ? adminLinks : farmerLinks;

  return (
    <nav className="navbar" id="main-navbar">
      <Link href="/dashboard" className="navbar-brand">
        AgriNova
      </Link>

      <ul className="navbar-links">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`navbar-link ${
                pathname === link.href ? "active" : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="navbar-actions" style={{ position: "relative" }} ref={dropdownRef}>
        {role !== "ADMIN" && (
          <button 
            className="btn-icon btn-ghost" 
            aria-label="Notifications"
            onClick={() => {
               setIsDropdownOpen(!isDropdownOpen);
               if (!isDropdownOpen) setHasViewedNotifications(true);
            }}
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {!hasViewedNotifications && notifications.length > 0 && (
               <span style={{ position: "absolute", top: 2, right: 2, background: "var(--danger)", width: 8, height: 8, borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 4px rgba(239, 68, 68, 0.4)" }} />
            )}
          </button>
        )}

        {isDropdownOpen && role !== "ADMIN" && (
           <div className="animate-slide-up" style={{
              position: "absolute",
              top: "calc(100% + 0.5rem)",
              right: "2rem",
              background: "white",
              border: "1px solid var(--border)",
              boxShadow: "0 10px 40px -10px rgba(0,0,0,0.15)",
              borderRadius: "12px",
              width: "350px",
              maxHeight: "450px",
              overflowY: "auto",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "1rem"
           }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.5rem" }}>
                 <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Recent Alerts</h4>
                 <button onClick={() => setIsDropdownOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
              </div>

              {notifications.length === 0 ? (
                 <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    No system messages at the moment.
                 </div>
              ) : (
                 notifications.map(n => (
                    <div key={n.id} style={{
                       padding: "0.75rem",
                       borderBottom: "1px solid var(--border-light)",
                       display: "flex",
                       gap: "0.75rem",
                       alignItems: "flex-start",
                       background: n.type === "WARNING" ? "var(--danger-50)" : "transparent"
                    }}>
                       <div style={{ color: n.type === "WARNING" ? "var(--danger)" : n.type === "SUCCESS" ? "var(--success)" : "var(--info)", marginTop: "2px" }}>
                          {n.type === "WARNING" && <AlertTriangle size={16} />}
                          {n.type === "SUCCESS" && <CheckCircle2 size={16} />}
                          {n.type === "INFO" && <Info size={16} />}
                       </div>
                       <div>
                          <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>{n.title}</p>
                          <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>{n.message}</p>
                          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{new Date(n.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                 ))
              )}
           </div>
        )}

        <LanguageSelector />
        <ThemeToggle />
        <button className="btn-icon btn-ghost" id="settings-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
        <Link href={role === "ADMIN" ? "/admin/profile" : "/profile"} className="avatar" id="user-avatar" style={{ textDecoration: "none", border: role === "ADMIN" ? "2px solid var(--primary-dark)" : "2px solid var(--primary-200)" }} aria-label="Profile">
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>
            {displayName.charAt(0).toUpperCase()}
          </span>
        </Link>
        <button 
          className="btn-icon btn-ghost" 
          id="logout-btn" 
          aria-label="Logout"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
