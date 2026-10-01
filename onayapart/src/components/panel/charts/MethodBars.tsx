import { chartColors } from "../chartColors";

const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };
const METHOD_COLOR: Record<string, string> = { NAKIT: chartColors.warning, KART: chartColors.income, HAVALE: "#5b7f9e" };

function money(v: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(v);
}

export default function MethodBars({ totals }: { totals: Record<string, number> }) {
  const max = Math.max(1, ...Object.values(totals));
  return (
    <div className="space-y-3">
      {(["NAKIT", "KART", "HAVALE"] as const).map((m) => (
        <div key={m}>
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-ink">{METHOD_LABEL[m]}</span>
            <span className="tabular-nums font-bold text-ink">{money(totals[m] ?? 0)}</span>
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
