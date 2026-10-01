import Link from "next/link";
import Icon from "./Icon";

type Key = "islem" | "kasa" | "banka" | "pos" | "rapor" | "faturalar" | "tga" | "depozito";

const ITEMS: { key: Key; href: string; label: string; icon: React.ComponentProps<typeof Icon>["name"]; classes: string }[] = [
  { key: "islem", href: "/panel/muhasebe/islem", label: "İşlem Yap", icon: "cash", classes: "bg-brand-600 hover:bg-brand-700" },
  { key: "kasa", href: "/panel/muhasebe/kasa", label: "Kasa Hareketleri", icon: "receipt", classes: "bg-gold-500 hover:bg-gold-600" },
  { key: "banka", href: "/panel/muhasebe/banka", label: "Banka Hareketleri", icon: "bank", classes: "bg-sky-600 hover:bg-sky-700" },
  { key: "pos", href: "/panel/muhasebe/pos", label: "Pos İşlemleri", icon: "card", classes: "bg-violet-600 hover:bg-violet-700" },
  { key: "faturalar", href: "/panel/muhasebe/faturalar", label: "Faturalar", icon: "doc", classes: "bg-rose-600 hover:bg-rose-700" },
  { key: "depozito", href: "/panel/muhasebe/depozito", label: "Depozitolar", icon: "key", classes: "bg-cyan-600 hover:bg-cyan-700" },
  { key: "tga", href: "/panel/muhasebe/tga", label: "TGA Bildirimi", icon: "badge", classes: "bg-indigo-600 hover:bg-indigo-700" },
  { key: "rapor", href: "/panel/muhasebe/rapor", label: "Rapor", icon: "trendUp", classes: "bg-brand-900 hover:bg-brand-800" },
];

export default function MuhasebeNav({ active }: { active?: Key }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-3 py-5 text-center text-sm font-extrabold text-white shadow-[0_8px_20px_-8px_rgba(12,51,36,.35)] transition ${item.classes} ${
            active === item.key ? "ring-2 ring-offset-2 ring-offset-brand-50 ring-white" : ""
          }`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
            <Icon name={item.icon} className="h-5 w-5" />
          </span>
          {item.label}
          {active === item.key && (
            <span className="absolute bottom-1.5 h-1 w-6 rounded-full bg-white/80" />
          )}
        </Link>
      ))}
    </div>
  );
}
