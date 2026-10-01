"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { chartColors } from "@/features/accounting/components/chart-colors";

export type RevenuePoint = { label: string; amount: number };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-bold text-ink">{label}</div>
      <div className="mt-0.5 text-brand-600">
        {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(
          payload[0].value
        )}
      </div>
    </div>
  );
}

export default function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.income} stopOpacity={0.35} />
            <stop offset="100%" stopColor={chartColors.income} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartColors.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartColors.inkSoft }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: chartColors.inkSoft }}
          axisLine={false}
          tickLine={false}
          width={44}
          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}b` : String(v))}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="amount" stroke={chartColors.income} strokeWidth={2.5} fill="url(#revenueFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
