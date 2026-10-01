"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { chartColors } from "../chartColors";

export type MonthlyPoint = { label: string; income: number; expense: number };

function money(v: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-card">
      <div className="mb-1 font-bold text-ink">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.dataKey === "income" ? "Gelir" : "Gider"}: {money(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartColors.inkSoft }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: chartColors.inkSoft }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}b` : String(v))}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: chartColors.grid }} />
        <Legend
          formatter={(v) => (v === "income" ? "Gelir" : "Gider")}
          iconType="circle"
          wrapperStyle={{ fontSize: 12, color: chartColors.inkSoft }}
        />
        <Bar dataKey="income" fill={chartColors.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="expense" fill={chartColors.expense} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
