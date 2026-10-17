import { getSiteSettings } from "@/features/content/queries";
import { parseEnabledLocales, type Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";

export type SiteNavItem = { href: string; label: string };
export type SiteLanguage = { href: string; code: string; active: boolean };

/** Açık sitenin tüm giriş noktalarının kullandığı, ayarlardan üretilen navigasyon verisi. */
export async function getSiteNavigation(locale?: Locale) {
  const settings = await getSiteSettings();
  const prefix = locale ? `/${locale}` : "";
  const labels = getDictionary(locale).nav;
  const navItems: SiteNavItem[] = [
    { href: `${prefix}/odalar`, label: labels.rooms },
    ...(settings.menuEnabled ? [{ href: `${prefix}/menu`, label: labels.menu }] : []),
    { href: `${prefix}/gunluk-kiralik-apart-erzurum`, label: labels.daily },
    { href: `${prefix}/aylik-kiralik-apart-erzurum`, label: labels.monthly },
    { href: `${prefix}/erzurum-ogrenci-apart`, label: labels.student },
    { href: `${prefix}/iletisim`, label: labels.contact },
  ];
  const languages: SiteLanguage[] = [
    { href: "/", code: "TR", active: !locale },
    ...parseEnabledLocales(settings.enabledLocales).map((language) => ({ href: `/${language}`, code: language.toUpperCase(), active: language === locale })),
  ];

  return { settings, prefix, navItems, languages };
}
