import Icon from "@/shared/components/panel/Icon";

type Tone = "brand" | "danger" | "gold" | "neutral";

const TONE_STYLES: Record<Tone, { bg: string; text: string; icon: string }> = {
  brand: { bg: "bg-brand-50", text: "text-brand-700", icon: "text-brand-600" },
  danger: { bg: "bg-danger-50", text: "text-danger-700", icon: "text-danger-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", icon: "text-gold-500" },
  neutral: { bg: "bg-brand-50", text: "text-ink", icon: "text-ink-soft" },
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  note,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  tone?: Tone;
  note?: string;
  /** Pozitif: yukselis (iyi), negatif: dusus - renk tona gore otomatik ayarlanir. */
  trend?: number;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-white p-4">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone === "danger" ? "bg-danger-500" : tone === "gold" ? "bg-gold-500" : "bg-brand-500"}`} />
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-ink-soft">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${t.bg} ${t.icon}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight tabular-nums text-ink">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {typeof trend === "number" && (
          <span className={`flex items-center gap-0.5 font-bold ${trend >= 0 ? "text-brand-600" : "text-danger-500"}`}>
            <Icon name={trend >= 0 ? "trendUp" : "trendDown"} className="h-3 w-3" />
            {Math.abs(trend)}%
          </span>
        )}
        {note && <span className="text-ink-soft">{note}</span>}
      </div>
    </div>
  );
}
