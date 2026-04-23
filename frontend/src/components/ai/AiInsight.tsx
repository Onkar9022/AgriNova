"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface AiInsightProps {
  type: "crop_explain" | "fertilizer_explain" | "soil_health" | "custom";
  data: Record<string, any>;
  title?: string;
}

function buildLocalCacheKey(type: string, data: Record<string, any>): string {
  const roundPh = Math.round((data.ph || 0) * 2) / 2;
  const roundN = Math.round((data.n || 0) / 10) * 10;
  const roundP = Math.round((data.p || 0) / 10) * 10;
  const roundK = Math.round((data.k || 0) / 10) * 10;
  const roundM = Math.round((data.moisture || 0) / 5) * 5;
  const crop = (data.crop || data.fertilizer || "").toLowerCase().trim();
  return `ai_v2:${type}:${crop}:${roundPh}:${roundN}:${roundP}:${roundK}:${roundM}`;
}

const CLIENT_CACHE_TTL = 12 * 60 * 60 * 1000;

/** Strip preamble, convert to clean HTML list */
function cleanResponse(raw: string): string {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);

  // Drop everything before the first bullet
  const firstBullet = lines.findIndex((l) => /^[•\-\*\d]/.test(l));
  const content = firstBullet >= 0 ? lines.slice(firstBullet) : lines;

  const items = content.map((line) => {
    const clean = line
      .replace(/^[•\-\*]\s*/, "")
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
    return clean;
  });

  return items
    .map((item) => `<div style="display:flex;gap:0.5rem;align-items:flex-start;margin-bottom:0.5rem"><span style="color:var(--primary);font-weight:700;flex-shrink:0">•</span><span>${item}</span></div>`)
    .join("");
}

export default function AiInsight({ type, data, title = "AI Insight" }: AiInsightProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Clear old v1 cache entries on mount
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("ai_cache:")) localStorage.removeItem(k);
      });
    } catch {}
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchExplanation = async () => {
      const cacheKey = buildLocalCacheKey(type, data);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.ts < CLIENT_CACHE_TTL) {
            if (isMounted) {
              setExplanation(parsed.text);
              setFromCache(true);
              setLoading(false);
            }
            return;
          }
          localStorage.removeItem(cacheKey);
        }
      } catch {}

      if (isMounted) {
        setLoading(true);
        setError(null);
      }

      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, data }),
        });
        if (!res.ok) throw new Error("AI service unavailable");
        const result = await res.json();
        
        if (isMounted) {
          setExplanation(result.explanation);
          setFromCache(!!result.cached);
          setLoading(false);
        }

        try {
          localStorage.setItem(cacheKey, JSON.stringify({ text: result.explanation, ts: Date.now() }));
        } catch {}
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to get AI explanation");
          setLoading(false);
        }
      }
    };

    fetchExplanation();
    return () => { isMounted = false; };
  }, [type, JSON.stringify(data)]); // Stringify data to avoid deep comparison issues

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: "12px",
      marginTop: "1rem",
      background: "linear-gradient(135deg, var(--primary-50), var(--bg-card))",
    }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.25rem",
          borderBottom: loading || explanation || error ? "1px solid var(--border-light)" : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {loading ? (
            <Loader2 size={16} color="var(--primary)" style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Sparkles size={16} color="var(--primary)" />
          )}
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)" }}>
            {loading ? "Analyzing..." : title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {fromCache && explanation && (
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, background: "var(--bg-muted)", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
              CACHED
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "0.75rem 1.25rem 1.25rem" }}>
        {loading ? (
          // Skeleton Loader
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
             <div style={{ width: "90%", height: 14, background: "var(--border)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
             <div style={{ width: "70%", height: 14, background: "var(--border)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
             <div style={{ width: "80%", height: 14, background: "var(--border)", borderRadius: 4, animation: "pulse 1.5s infinite" }} />
          </div>
        ) : error ? (
          <p style={{ fontSize: "0.85rem", color: "var(--danger)", lineHeight: 1.6, margin: 0 }}>
            {error}. Explanation unavailable.
          </p>
        ) : (
          <div
            style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.75, wordBreak: "break-word" }}
            dangerouslySetInnerHTML={{ __html: cleanResponse(explanation || "") }}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
