"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

const LANGS = [
  { code: "en", label: "English", native: "EN" },
  { code: "hi", label: "हिन्दी", native: "HI" },
  { code: "mr", label: "मराठी", native: "MR" },
  { code: "kn", label: "ಕನ್ನಡ", native: "KN" },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("en");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if Google Translate has already set a language
    const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
    if (match) setCurrent(match[1]);

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load Google Translate script once
  useEffect(() => {
    if (document.getElementById("gt-script")) return;

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", includedLanguages: "en,hi,mr,kn", autoDisplay: false },
        "gt-hidden"
      );
    };

    const s = document.createElement("script");
    s.id = "gt-script";
    s.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const switchLang = (code: string) => {
    setCurrent(code);
    setOpen(false);

    // Try using the Google Translate combo box if loaded
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      combo.value = code === "en" ? "" : code;
      combo.dispatchEvent(new Event("change"));
      return;
    }

    // Fallback: set the googtrans cookie and reload
    document.cookie = `googtrans=/en/${code};path=/`;
    document.cookie = `googtrans=/en/${code};path=/;domain=${window.location.hostname}`;
    if (code === "en") {
      document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC";
      document.cookie = `googtrans=;path=/;domain=${window.location.hostname};expires=Thu, 01 Jan 1970 00:00:00 UTC`;
    }
    window.location.reload();
  };

  const activeLang = LANGS.find((l) => l.code === current) || LANGS[0];

  return (
    <>
      {/* Hidden container for Google Translate engine */}
      <div id="gt-hidden" style={{ display: "none" }} />

      <div ref={ref} style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.35rem 0.65rem",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--bg-card)",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            transition: "all 0.2s",
          }}
          title="Change Language"
        >
          <Globe size={14} />
          <span>{activeLang.label}</span>
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 30px -8px rgba(0,0,0,0.18)",
              borderRadius: "10px",
              overflow: "hidden",
              zIndex: 200,
              minWidth: "150px",
              animation: "slideUp 0.2s ease-out",
            }}
          >
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => switchLang(l.code)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "0.6rem 1rem",
                  border: "none",
                  cursor: "pointer",
                  background: current === l.code ? "var(--primary-50)" : "transparent",
                  fontSize: "0.85rem",
                  fontWeight: current === l.code ? 700 : 500,
                  color: current === l.code ? "var(--primary)" : "var(--text-primary)",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) => {
                  if (current !== l.code) e.currentTarget.style.background = "var(--bg-muted)";
                }}
                onMouseOut={(e) => {
                  if (current !== l.code) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{l.label}</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  {l.native}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hide Google Translate UI chrome */}
      <style>{`
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { display: none !important; }
        #goog-gt-tt { display: none !important; }
        .goog-te-balloon-frame { display: none !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        .skiptranslate { display: none !important; }
        .skiptranslate iframe { display: none !important; }
      `}</style>
    </>
  );
}
