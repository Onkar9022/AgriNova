"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { month: "AUG 24", N: 65, P: 42, K: 38 },
  { month: "SEP 24", N: 72, P: 48, K: 35 },
  { month: "OCT 24", N: 85, P: 55, K: 42 },
  { month: "NOV 24", N: 90, P: 52, K: 48 },
];

export default function SoilTrendChart({ data = defaultData }: { data?: any[] }) {
  const chartData = data.length > 0 ? data : defaultData;
  return (
    <ResponsiveContainer width="100%" height={220} minWidth={200}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
          }}
        />
        <Line
          type="monotone"
          dataKey="N"
          stroke="var(--primary)"
          strokeWidth={2.5}
          dot={{ fill: "var(--primary)", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="P"
          stroke="var(--accent)"
          strokeWidth={2.5}
          dot={{ fill: "var(--accent)", r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="K"
          stroke="var(--brown)"
          strokeWidth={2.5}
          dot={{ fill: "var(--brown)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
