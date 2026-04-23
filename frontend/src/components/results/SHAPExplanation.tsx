"use client";

interface SHAPFactor {
  feature:      string;
  display_name: string;
  value:        string;
  shap_value:   number;
  abs_shap:     number;
  direction:    "positive" | "negative";
  strength:     "strong" | "moderate" | "weak";
  explanation:  string;
}

interface SHAPResult {
  crop:       string;
  base_value: number;
  factors:    SHAPFactor[];
}

interface Props {
  explanation: SHAPResult;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getBarWidth(absShap: number, maxAbsShap: number): string {
  const pct = Math.min((absShap / maxAbsShap) * 100, 100);
  return `${Math.round(pct)}%`;
}

function formatCropName(crop: string): string {
  return crop.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FactorRow({
  factor,
  maxAbsShap,
}: {
  factor: SHAPFactor;
  maxAbsShap: number;
}) {
  const isPositive = factor.direction === "positive";
  const barWidth   = getBarWidth(factor.abs_shap, maxAbsShap);

  return (
    <div
      style={{
        padding:      "12px 0",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      {/* Top row: name + value + badge */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          marginBottom:   "6px",
          gap:            "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          {/* Direction dot */}
          <div
            style={{
              width:        "8px",
              height:       "8px",
              borderRadius: "50%",
              flexShrink:   0,
              background:   isPositive
                ? "var(--success)"
                : "var(--danger)",
            }}
          />
          <span
            style={{
              fontSize:   "0.9rem",
              fontWeight: 600,
              color:      "var(--text-primary)",
            }}
          >
            {factor.display_name}
          </span>
        </div>

        {/* Value pill */}
        <span
          style={{
            fontSize:        "0.8rem",
            padding:         "2px 8px",
            borderRadius:    "99px",
            background:      "var(--bg-muted)",
            color:           "var(--text-secondary)",
            border:          "1px solid var(--border)",
            whiteSpace:      "nowrap",
            flexShrink:      0,
            fontWeight: 700
          }}
        >
          {factor.value}
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          height:       "6px",
          background:   "var(--bg-muted)",
          borderRadius: "3px",
          overflow:     "hidden",
          margin:       "6px 0",
        }}
      >
        <div
          style={{
            height:       "100%",
            width:        barWidth,
            borderRadius: "3px",
            background:   isPositive
              ? "var(--success)"
              : "var(--danger)",
            transition:   "width 0.5s ease",
          }}
        />
      </div>

      {/* Explanation text */}
      <p
        style={{
          fontSize:    "0.8rem",
          color:       "var(--text-secondary)",
          margin:      "6px 0 0",
          lineHeight:  1.5,
        }}
      >
        {factor.explanation}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SHAPExplanation({ explanation }: Props) {
  if (!explanation || !explanation.factors?.length) return null;

  const positiveFactors = explanation.factors.filter((f) => f.direction === "positive");
  const negativeFactors = explanation.factors.filter((f) => f.direction === "negative");
  const maxAbsShap      = Math.max(...explanation.factors.map((f) => f.abs_shap), 0.01);
  const cropName        = formatCropName(explanation.crop);

  return (
    <div className="card"
      style={{
        marginTop:    "1.5rem",
        borderTop: "3px solid var(--primary)"
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontSize:    "1.25rem",
            fontWeight:  800,
            margin:      "0 0 4px",
            color:       "var(--text-primary)",
          }}
        >
          Why {cropName}?
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color:    "var(--text-secondary)",
            margin:   0,
            lineHeight: 1.5
          }}
        >
          These soil factors most influenced this mathematical recommendation based on ML regression layers.
        </p>
      </div>

      {/* Legend */}
      <div
        style={{
          display:      "flex",
          gap:          "16px",
          marginBottom: "12px",
          fontSize:     "0.8rem",
          fontWeight: 600,
          color:        "var(--text-secondary)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              display:      "inline-block",
              width:        "8px",
              height:       "8px",
              borderRadius: "50%",
              background:   "var(--success)",
            }}
          />
          Supports this crop
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              display:      "inline-block",
              width:        "8px",
              height:       "8px",
              borderRadius: "50%",
              background:   "var(--danger)",
            }}
          />
          Works against it
        </span>
      </div>

      {/* Positive factors first */}
      {positiveFactors.map((f) => (
        <FactorRow key={f.feature} factor={f} maxAbsShap={maxAbsShap} />
      ))}

      {/* Negative factors */}
      {negativeFactors.map((f) => (
        <FactorRow key={f.feature} factor={f} maxAbsShap={maxAbsShap} />
      ))}

      {/* Footer note */}
      <p
        style={{
          fontSize:   "0.75rem",
          color:      "var(--text-muted)",
          margin:     "12px 0 0",
          lineHeight: 1.5,
          fontWeight: 600
        }}
      >
        Bar length shows absolute influence threshold. Green signifies your soil conditions specifically favor this crop type. Red represents resistance to suitability.
      </p>
    </div>
  );
}
