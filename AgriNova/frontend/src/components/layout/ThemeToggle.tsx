"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agrinova-theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    localStorage.setItem("agrinova-theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label="Toggle dark mode"
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className={`theme-toggle-track ${dark ? "dark" : ""}`}>
        <Sun size={12} className="theme-toggle-sun" />
        <Moon size={12} className="theme-toggle-moon" />
        <div className="theme-toggle-thumb" />
      </div>
    </button>
  );
}
