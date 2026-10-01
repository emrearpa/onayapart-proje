"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { expenseCategoryColors } from "@/features/accounting/components/chart-colors";
import { fmtMoneyRounded } from "@/shared/lib/dates";
import type { ChartTooltipProps } from "@/features/accounting/components/charts/tooltip";

export type SlicePoint = { label: string; amount: number };

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-bold text-ink">{p.name}</div>
      <div className="mt-0.5" style={{ color: p.payload.fill }}>
        {fmtMoneyRounded(p.value)}
      </div>
    </div>
  );
}

export default function ExpenseDonut({ data }: { data: SlicePoint[] }) {
  if (data.length === 0) {
    return <div className="grid h-[220px] place-items-center text-sm text-ink-soft">Bu dönemde gider kaydı yok.</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={2} stroke="#fff">
            {data.map((_, i) => (
              <Cell key={i} fill={expenseCategoryColors[i % expenseCategoryColors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex-1 space-y-2 text-xs">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: expenseCategoryColors[i % expenseCategoryColors.length] }} />
              {d.label}
            </span>
            <span className="font-bold text-ink">{fmtMoneyRounded(d.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
