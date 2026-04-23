"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function SoilHealthScore({ score }: { score: number }) {
  // Clamp score between 0 and 100
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Data for the gauge: [filled, empty]
  const data = [
    { name: "Score", value: normalizedScore },
    { name: "Remaining", value: 100 - normalizedScore }
  ];

  // Determine color based on score
  let fillStatusColor = "var(--danger)";
  if (normalizedScore >= 80) fillStatusColor = "var(--success)";
  else if (normalizedScore >= 50) fillStatusColor = "var(--accent)";

  return (
    <div style={{ position: "relative", width: "100%", height: "180px", display: "flex", justifyContent: "center", alignItems: "center", marginTop: "1rem" }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={120}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius="75%"
            outerRadius="100%"
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={fillStatusColor} />
            <Cell fill="var(--bg-muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Absolute positioned score label in the center */}
      <div 
        style={{ 
          position: "absolute", 
          top: "50%", 
          left: "50%", 
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "0"
        }}
      >
        <span style={{ fontSize: "2.75rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: "1.1" }}>
          {normalizedScore}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
          Score
        </span>
      </div>
    </div>
  );
}
