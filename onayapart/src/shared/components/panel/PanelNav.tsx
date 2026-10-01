"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/shared/components/panel/Icon";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  color: "brand" | "sky" | "gold" | "violet" | "rose";
};

// Tailwind'in siniflari derleme zamaninda taradigi icin renk adlarini burada
// tek tek, tam yazilmis olarak tutuyoruz - `bg-${color}-500` gibi dinamik
// birlestirme calismaz (JIT bu sinifi goremez, CSS'e eklemez).
const COLOR: Record<NavItem["color"], { chip: string; icon: string; activeChip: string; activeIcon: string; activeText: string }> = {
  brand: { chip: "bg-brand-400/20", icon: "text-brand-300", activeChip: "bg-brand-500", activeIcon: "text-white", activeText: "text-brand-800" },
  sky: { chip: "bg-sky-400/20", icon: "text-sky-300", activeChip: "bg-sky-500", activeIcon: "text-white", activeText: "text-sky-800" },
  gold: { chip: "bg-gold-400/20", icon: "text-gold-300", activeChip: "bg-gold-500", activeIcon: "text-white", activeText: "text-gold-800" },
  violet: { chip: "bg-violet-400/20", icon: "text-violet-300", activeChip: "bg-violet-500", activeIcon: "text-white", activeText: "text-violet-800" },
  rose: { chip: "bg-rose-400/20", icon: "text-rose-300", activeChip: "bg-rose-500", activeIcon: "text-white", activeText: "text-rose-800" },
};

export default function PanelNav({ groups }: { groups: NavItem[][] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-6 space-y-5">
      {groups.map((items, gi) => (
        <div key={gi} className="space-y-1">
          {items.map((n) => {
            const active = n.href === "/panel" ? pathname === "/panel" : pathname.startsWith(n.href);
            const c = COLOR[n.color];
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition ${
                  active ? "bg-white shadow-sm" : "text-brand-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${active ? c.activeChip : c.chip}`}>
                  <Icon name={n.icon} className={`h-4 w-4 ${active ? c.activeIcon : c.icon}`} />
                </span>
                <span className={active ? c.activeText : ""}>{n.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
