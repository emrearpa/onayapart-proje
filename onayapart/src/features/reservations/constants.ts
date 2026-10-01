// Rezervasyon alanindaki sabit kod listeleri. Saf veri - istemci bilesenleri ve
// prisma/seed.ts de buradan okur.

export const STAY_TYPES = [
  { key: "GUNLUK", label: "Günlük" },
  { key: "HAFTALIK", label: "Haftalık" },
  { key: "AYLIK", label: "Aylık" },
  { key: "DONEMLIK", label: "Öğrenci dönemlik" },
  { key: "YILLIK", label: "Yıllık" },
  { key: "KURUMSAL", label: "Kurumsal" },
] as const;

export type StayType = (typeof STAY_TYPES)[number]["key"];

export const STAY_TYPE_LABEL: Record<string, string> = Object.fromEntries(STAY_TYPES.map((s) => [s.key, s.label]));

/** Her oda tipi icin acilan fiyat satirlari (kurumsal fiyat rezervasyonda elle girilir). */
export const DEFAULT_RATES = STAY_TYPES.filter((s) => s.key !== "KURUMSAL").map((s, i) => ({
  stayType: s.key,
  label: s.label,
  sort: i + 1,
}));

/** Giris gunune gore duzenli (aylik) odeme takibi yapilan konaklama tipleri. */
export const RECURRING_STAY_TYPES: StayType[] = ["AYLIK", "DONEMLIK", "KURUMSAL", "YILLIK"];

export const RESERVATION_STATUSES = ["OPSIYON", "ONAYLI", "GIRIS_YAPTI", "TAMAMLANDI", "IPTAL"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Odayi fiilen dolu tutan durumlar (cakisma ve musaitlik hesabinda kullanilir). */
export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ["OPSIYON", "ONAYLI", "GIRIS_YAPTI"];

export const RESERVATION_STATUS_LABEL: Record<string, string> = {
  OPSIYON: "Opsiyon",
  ONAYLI: "Onaylı",
  GIRIS_YAPTI: "Giriş yaptı",
  TAMAMLANDI: "Çıkış Yaptı",
  IPTAL: "İptal",
};

export const PAYMENT_METHODS = [
  { key: "NAKIT", label: "Nakit" },
  { key: "KART", label: "Kart" },
  { key: "HAVALE", label: "Havale" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["key"];

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, m.label]));

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.some((m) => m.key === value);
}
