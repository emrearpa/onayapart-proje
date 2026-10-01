/** Alan adi ve marka kimligi - kod uzerinden yonetilir, panelden degistirilmez. */
export const site = {
  name: "Onay Apart Rezidans",
  shortName: "Onay Apart",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://onayapart.com",
} as const;

/** Panelden yonetilen iletisim/tanitim bilgilerinin ortak sekli. */
export type SiteContact = {
  phoneDisplay: string;
  phoneHref: string;
  whatsapp: string;
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
  addressPostalCode: string;
  heroEyebrow: string;
  heroTitle: string;
  heroIntro: string;
};

export function fullAddress(s: Pick<SiteContact, "addressStreet" | "addressPostalCode" | "addressDistrict" | "addressCity">) {
  return `${s.addressStreet}, ${s.addressPostalCode} ${s.addressDistrict}/${s.addressCity}`;
}

export function waLink(whatsapp: string, text: string) {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}

export function mapsLink(s: Pick<SiteContact, "addressStreet" | "addressDistrict" | "addressCity">) {
  const q = `ONAY APART REZIDANCE ${s.addressStreet} ${s.addressDistrict} ${s.addressCity}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export const stayTypes = [
  { key: "GUNLUK", label: "Günlük" },
  { key: "HAFTALIK", label: "Haftalık" },
  { key: "AYLIK", label: "Aylık" },
  { key: "DONEMLIK", label: "Öğrenci dönemlik" },
  { key: "YILLIK", label: "Yıllık" },
  { key: "KURUMSAL", label: "Kurumsal" },
] as const;
