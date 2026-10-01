export function startOfDay(d: Date | string) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export function dayDiff(a: Date, b: Date) {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

export function overlaps(aIn: Date, aOut: Date, bIn: Date, bOut: Date) {
  return startOfDay(aIn) < startOfDay(bOut) && startOfDay(bIn) < startOfDay(aOut);
}

const trDate = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
const trShort = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" });

export const fmtDate = (d: Date | string) => trDate.format(new Date(d));
export const fmtShort = (d: Date | string) => trShort.format(new Date(d));

export function fmtMoney(n: number) {
  if (!n) return "—";
  // Intl'in "currency" stiline degil, sadece sayi bicimine guveniyoruz - bazi sunucu
  // ortamlarinda (kucuk ICU verisi) para birimi sembolu sessizce "TRY" yazisina
  // donusebiliyor. Sembolu kendimiz ekleyerek her ortamda garantiye aliyoruz.
  const formatted = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return `${formatted} \u20BA`;
}

export function toInputDate(d: Date) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
