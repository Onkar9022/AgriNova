"use client";

import { useEffect } from "react";

export default function FarmerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Farmer route error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
    }}>
      <div className="card" style={{
        textAlign: "center",
        padding: "3rem",
        maxWidth: "520px",
        width: "100%",
      }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🌾</div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.75rem", color: "var(--text-primary)" }}>
          Something Went Wrong
        </h2>
        <p style={{
          color: "var(--text-secondary)",
          marginBottom: "1.5rem",
          lineHeight: 1.7,
          fontSize: "0.9rem",
        }}>
          An unexpected error occurred while loading this page. 
          This is usually temporary — please try again.
        </p>

        {error.digest && (
          <p style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: "1rem",
            fontFamily: "monospace",
            background: "var(--bg-muted)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-sm)",
          }}>
            Error ID: {error.digest}
          </p>
        )}

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button
            onClick={reset}
            className="btn btn-primary"
          >
            Try Again
          </button>
          <a href="/dashboard" className="btn btn-outline">
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
