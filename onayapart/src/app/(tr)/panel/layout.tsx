import Link from "next/link";
import { cookies } from "next/headers";
import { logout } from "./actions";
import { verifyStaffSessionToken, permissionForPath } from "@/lib/staffAuth";
import PanelNav, { NavItem } from "@/components/panel/PanelNav";

export const metadata = { title: "Onay ERP", robots: { index: false, follow: false } };

// Sirayla degil, kumeler halinde: operasyon / finans-personel / site-pazarlama / yonetim.
// Her kume, sol menude aralarina bosluk birakilarak gorsel olarak ayrilir.
const navGroups: NavItem[][] = [
  [
    { href: "/panel", label: "Gösterge paneli", icon: "home", color: "brand" },
    { href: "/panel/rezervasyonlar", label: "Rezervasyonlar", icon: "calendar", color: "sky" },
    { href: "/panel/musteriler", label: "Müşteriler", icon: "users", color: "brand" },
    { href: "/panel/bakim-talepleri", label: "Bakım talepleri", icon: "wrench", color: "rose" },
    { href: "/panel/envanter", label: "Envanter / Stok", icon: "receipt", color: "gold" },
    { href: "/panel/menu", label: "Restoran Menüsü", icon: "doc", color: "rose" },
  ],
  [
    { href: "/panel/muhasebe", label: "Ön Muhasebe", icon: "cash", color: "gold" },
    { href: "/panel/personel", label: "Personel", icon: "badge", color: "violet" },
    { href: "/panel/evraklar", label: "Firma Evrakları", icon: "doc", color: "sky" },
    { href: "/panel/is-takibi", label: "İş Takibi", icon: "message", color: "gold" },
  ],
  [
    { href: "/panel/tipler", label: "Oda tipleri", icon: "door", color: "sky" },
    { href: "/panel/odalar", label: "Odalar ve fiyatlar", icon: "receipt", color: "brand" },
    { href: "/panel/icerik", label: "Site içeriği", icon: "doc", color: "gold" },
    { href: "/panel/bilgilendirme", label: "Bilgilendirme", icon: "message", color: "sky" },
    { href: "/panel/talepler", label: "Siteden gelen talepler", icon: "inbox", color: "rose" },
  ],
  [
    { href: "/panel/kullanicilar", label: "Kullanıcılar", icon: "key", color: "violet" },
    { href: "/panel/gecmis", label: "İşlem geçmişi", icon: "doc", color: "violet" },
  ],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const isFullAdmin =
    Boolean(cookieStore.get("oa_panel")?.value) && cookieStore.get("oa_panel")?.value === process.env.PANEL_PASSWORD;

  const staffSession = isFullAdmin
    ? null
    : await verifyStaffSessionToken(process.env.PANEL_PASSWORD ?? "", cookieStore.get("oa_staff")?.value);

  // Tam admin her seyi gorur. Personel sadece kendi izinlerine giren linkleri gorur;
  // "Gosterge paneli" ve "Kullanicilar" hicbir zaman personele gosterilmez.
  const visibleGroups = isFullAdmin
    ? navGroups
    : navGroups
        .map((items) =>
          items.filter((n) => {
            const perm = permissionForPath(n.href);
            return perm && staffSession?.permissions.includes(perm);
          })
        )
        .filter((items) => items.length > 0);

  const firstHref = visibleGroups[0]?.[0]?.href ?? "/panel";

  return (
    <div className="min-h-screen bg-brand-50/50 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-gradient-to-b from-brand-900 via-brand-900 to-brand-800 p-5 text-brand-100">
        <Link href={isFullAdmin ? "/panel" : firstHref} className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-extrabold shadow-sm">
            OA
          </span>
          <span className="font-extrabold leading-tight">
            ONAY ERP
            <span className="block text-[11px] font-medium text-brand-300">
              {isFullAdmin ? "Yönetim paneli" : staffSession?.fullName ?? "Personel paneli"}
            </span>
          </span>
        </Link>

        <PanelNav groups={visibleGroups} />

        <div className="mt-6 space-y-1 border-t border-white/10 pt-5 text-sm">
          <Link href="/" className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">🌐</span>
            Siteyi görüntüle
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">⏻</span>
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <div className="p-5 lg:p-8">{children}</div>
    </div>
  );
}
