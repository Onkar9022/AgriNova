"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

const defaultData = [
  { month: "JUL", ph: 6.5 },
  { month: "AUG", ph: 6.6 },
  { month: "SEP", ph: 6.7 },
  { month: "OCT", ph: 6.9 },
  { month: "NOV", ph: 6.8 },
];

export default function PHHistoryChart({ data = defaultData }: { data?: any[] }) {
  const chartData = data.length > 0 ? data : defaultData;
  return (
    <ResponsiveContainer width="100%" height={160} minWidth={200}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="phGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
        {/* Optimal pH band */}
        <ReferenceArea
          y1={6.5}
          y2={7.0}
          fill="var(--primary)"
          fillOpacity={0.06}
          label={{
            value: "OPTIMAL",
            position: "right",
            fontSize: 10,
            fill: "var(--text-muted)",
          }}
        />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[5.5, 8]}
          tick={{ fontSize: 11, fill: "var(--text-muted)" }}
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
          formatter={(value: any) => [`${value}`, "pH"]}
        />
        <Area
          type="monotone"
          dataKey="ph"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#phGradient)"
          dot={{ fill: "var(--primary)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
