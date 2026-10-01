import { chartColors } from "@/features/accounting/components/chart-colors";
import { fmtMoneyRounded } from "@/shared/lib/dates";
import { PAYMENT_METHODS } from "@/features/reservations/constants";

const METHOD_COLOR: Record<string, string> = { NAKIT: chartColors.warning, KART: chartColors.income, HAVALE: "#5b7f9e" };

export default function MethodBars({ totals }: { totals: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(totals));
  return (
    <div className="space-y-3">
      {PAYMENT_METHODS.map(({ key: m, label }) => (
        <div key={m}>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-ink">{label}</span>
            <span className="tabular-nums font-bold text-ink">{fmtMoneyRounded(totals[m] ?? 0)}</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-brand-50">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.round(((totals[m] ?? 0) / max) * 100)}%`, background: METHOD_COLOR[m] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
