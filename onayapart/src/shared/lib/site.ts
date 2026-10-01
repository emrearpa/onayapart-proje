import { env } from "@/shared/lib/env";

/** Alan adi ve marka kimligi - kod uzerinden yonetilir, panelden degistirilmez. */
export const site = {
  name: "Onay Apart Rezidans",
  shortName: "Onay Apart",
  url: env.siteUrl,
} as const;

type Address = { addressStreet: string; addressPostalCode: string; addressDistrict: string; addressCity: string };

export function fullAddress(s: Address) {
  return `${s.addressStreet}, ${s.addressPostalCode} ${s.addressDistrict}/${s.addressCity}`;
}

export function waLink(whatsapp: string, text?: string) {
  const base = `https://wa.me/${whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

function mapsQuery(s: Omit<Address, "addressPostalCode">) {
  return encodeURIComponent(`${site.name} ${s.addressStreet} ${s.addressDistrict} ${s.addressCity}`);
}

export function mapsLink(s: Omit<Address, "addressPostalCode">) {
  return `https://www.google.com/maps/search/?api=1&query=${mapsQuery(s)}`;
}

/** API anahtari gerektirmeyen gomulu harita adresi (iframe src). */
export function mapsEmbedUrl(s: Omit<Address, "addressPostalCode">) {
  return `https://www.google.com/maps?q=${mapsQuery(s)}&output=embed`;
}
