/**
 * Cok dilli site yapilandirmasi. Turkce (varsayilan) URL'lerde on ek almaz (/odalar),
 * mevcut SEO'ya dokunulmaz. Diger diller /en, /ar, /fa, /ru, /de, /fr, /es, /az, /ka
 * altinda yasar. Sistemin DESTEKLEDIGI tum diller bu liste - hangi firmanin
 * sitesinde HANGILERI ACIK oldugu ayri (bkz. SiteSetting.enabledLocales, "hreflangAlternates"
 * ve "isLocaleEnabled" fonksiyonlari).
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

/** SiteSetting.enabledLocales alanindaki virgullu metni gecerli Locale dizisine cevirir. */
export function parseEnabledLocales(raw: string | null | undefined): Locale[] {
  if (!raw) return defaultEnabledLocales;
  const parsed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(isLocale);
  return parsed.length > 0 ? parsed : defaultEnabledLocales;
}

/**
 * Bir Turkce sayfanin metadata.alternates.languages degeri. Next.js'te bir sayfa
 * kendi `alternates`'ini tanimlarsa, ust layout'takini TAMAMEN ezer - bu yuzden
 * her Turkce sayfa kendi alternates'inde bunu da eklemeli (path olmadan "/" ise
 * bos birak, varsayilan olarak ayni path kullanilir). Sadece ACIK olan diller
 * eklenir - kapali bir dili arama motorlarina bildirmeyiz.
 */
export function hreflangAlternates(path: string, enabledLocales: Locale[] = defaultEnabledLocales): Record<string, string> {
  const languages: Record<string, string> = { "x-default": path, tr: path };
  for (const l of enabledLocales) languages[l] = `/${l}${path}`;
  return languages;
}
