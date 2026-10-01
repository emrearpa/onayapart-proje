// Panel bolumleri ve izin anahtarlari. Edge'de (middleware) de kullanilir; saf veri.

export const PERMISSIONS = [
  { key: "rezervasyonlar", label: "Rezervasyonlar", paths: ["/panel/rezervasyonlar"] },
  { key: "musteriler", label: "Müşteriler", paths: ["/panel/musteriler"] },
  { key: "muhasebe", label: "Ön Muhasebe", paths: ["/panel/muhasebe"] },
  { key: "personel", label: "Personel", paths: ["/panel/personel"] },
  { key: "bakim", label: "Bakım talepleri", paths: ["/panel/bakim-talepleri"] },
  { key: "envanter", label: "Envanter / Stok", paths: ["/panel/envanter"] },
  { key: "menu", label: "Restoran Menüsü", paths: ["/panel/menu"] },
  { key: "evraklar", label: "Firma Evrakları", paths: ["/panel/evraklar"] },
  { key: "istakibi", label: "İş Takibi", paths: ["/panel/is-takibi"] },
  { key: "bilgilendirme", label: "Bilgilendirme (WhatsApp)", paths: ["/panel/bilgilendirme"] },
  { key: "odalar", label: "Oda tipleri ve odalar", paths: ["/panel/odalar", "/panel/tipler"] },
  { key: "icerik", label: "Site içeriği", paths: ["/panel/icerik"] },
  { key: "talepler", label: "Siteden gelen talepler", paths: ["/panel/talepler"] },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PANEL_LOGIN_PATH = "/panel/giris";

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** URL yoluna gore hangi iznin gerektigini soyler. Eslesme yoksa (orn. /panel kok
 *  sayfasi veya /panel/kullanicilar) sayfa yalnizca tam admine aciktir. */
export function permissionForPath(pathname: string): PermissionKey | null {
  return PERMISSIONS.find((p) => p.paths.some((prefix) => matchesPath(pathname, prefix)))?.key ?? null;
}

/** Bir iznin panelde karsilik geldigi ilk sayfa (yonlendirme icin). */
export function pathForPermission(key: string): string {
  return PERMISSIONS.find((p) => p.key === key)?.paths[0] ?? PANEL_LOGIN_PATH;
}

export function parsePermissions(raw: string | null | undefined): PermissionKey[] {
  const valid = new Set<string>(PERMISSIONS.map((p) => p.key));
  return (raw ?? "").split(",").filter((key): key is PermissionKey => valid.has(key));
}
