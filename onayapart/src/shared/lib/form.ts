// Server action'larda FormData okumak icin kucuk yardimcilar.

export function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function optStr(formData: FormData, key: string): string | null {
  return str(formData, key) || null;
}

/** Gecersiz ya da bos girdide fallback doner; NaN/Infinity asla veritabanina gitmez. */
export function num(formData: FormData, key: string, fallback = 0): number {
  const raw = str(formData, key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Sifirdan buyuk degilse 0 doner (tutar, miktar gibi alanlar icin). */
export function positiveNum(formData: FormData, key: string): number {
  const n = num(formData, key);
  return n > 0 ? n : 0;
}

export function checked(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

export function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function date(formData: FormData, key: string): Date | null {
  return parseDate(str(formData, key));
}

export function strList(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((v) => (typeof v === "string" ? v.trim() : ""));
}

/** Formdan gelen "geri don" adresini yalnizca site ici bir yol ise kabul eder (acik yonlendirme korumasi). */
export function safeReturnPath(value: string, fallback: string, prefix = "/panel"): string {
  const isInternal = value.startsWith(prefix) && !value.startsWith("//") && !value.includes("\\") && !value.includes("://");
  return isInternal ? value.split("?")[0] : fallback;
}

/** Dosya alani bos birakildiginda tarayici 0 baytlik bir File gonderir; onu yok sayar. */
export function uploadedFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 ? value : null;
}
