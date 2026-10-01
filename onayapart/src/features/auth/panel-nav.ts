import type { NavItem } from "@/shared/components/panel/PanelNav";
import { can, type PanelSession } from "@/features/auth/guards";
import { permissionForPath } from "@/features/auth/permissions";

// Sirayla degil, kumeler halinde: operasyon / finans-personel / site-pazarlama / yonetim.
// Her kume, sol menude aralarina bosluk birakilarak gorsel olarak ayrilir.
const NAV_GROUPS: NavItem[][] = [
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

/**
 * Oturumun gorebilecegi menu kumeleri. Tam admin her seyi gorur; personel yalnizca
 * izinli bolumleri. Izin anahtari olmayan sayfalar (gosterge paneli, kullanicilar,
 * islem gecmisi) yalnizca admine gosterilir.
 */
export function visibleNavGroups(session: PanelSession): NavItem[][] {
  if (session.role === "admin") return NAV_GROUPS;
  return NAV_GROUPS.map((items) =>
    items.filter((item) => {
      const permission = permissionForPath(item.href);
      return permission !== null && can(session, permission);
    })
  ).filter((items) => items.length > 0);
}
