/**
 * Cok dilli site yapilandirmasi. Turkce (varsayilan) URL'lerde on ek almaz (/odalar),
 * mevcut SEO'ya dokunulmaz. Diger diller /en, /ar, /fa, /ru, /de, /fr, /es, /az, /ka
 * altinda yasar. Sistemin DESTEKLEDIGI tum diller bu liste - hangi firmanin
 * sitesinde HANGILERI ACIK oldugu ayridir (bkz. SiteSetting.enabledLocales ve parseEnabledLocales).
 */
export const locales = ["en", "ar", "fa", "ru", "de", "fr", "es", "az", "ka"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale = "tr" as const;
export type AnyLocale = Locale | typeof defaultLocale;

export const localeConfig: Record<Locale, { label: string; nativeLabel: string; dir: "ltr" | "rtl"; htmlLang: string }> = {
  en: { label: "English", nativeLabel: "English", dir: "ltr", htmlLang: "en" },
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "rtl", htmlLang: "ar" },
  fa: { label: "Persian", nativeLabel: "فارسی", dir: "rtl", htmlLang: "fa" },
  ru: { label: "Russian", nativeLabel: "Русский", dir: "ltr", htmlLang: "ru" },
  de: { label: "German", nativeLabel: "Deutsch", dir: "ltr", htmlLang: "de" },
  fr: { label: "French", nativeLabel: "Français", dir: "ltr", htmlLang: "fr" },
  es: { label: "Spanish", nativeLabel: "Español", dir: "ltr", htmlLang: "es" },
  az: { label: "Azerbaijani", nativeLabel: "Azərbaycanca", dir: "ltr", htmlLang: "az" },
  ka: { label: "Georgian", nativeLabel: "ქართული", dir: "ltr", htmlLang: "ka" },
};

/** Bir firma sitesinde varsayilan olarak acik gelen diller - kurulumda ilk deger. */
export const defaultEnabledLocales: Locale[] = ["en", "ar", "fa", "ru"];

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

/** Panelde hicbir dil secilmediginde saklanan deger: site yalnizca Turkce yayinlanir. */
export const NO_LOCALES = "none";

/** SiteSetting.enabledLocales alanindaki virgullu metni gecerli Locale dizisine cevirir. */
export function parseEnabledLocales(raw: string | null | undefined): Locale[] {
  if (raw === NO_LOCALES) return [];
  if (!raw) return defaultEnabledLocales;
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(isLocale);
  return parsed.length > 0 ? parsed : defaultEnabledLocales;
}
