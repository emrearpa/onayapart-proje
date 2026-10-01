import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale, localeConfig } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site } from "@/shared/lib/site";
import { getEnabledLocales } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import { toLocale, type LocaleParams } from "@/features/site/locale";
import RootDocument from "@/features/site/components/RootDocument";

export const viewport: Viewport = { themeColor: "#1c6045" };

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  const t = getDictionary(locale).home;

  return {
    metadataBase: new URL(site.url),
    title: { default: `${t.heroTitle} | ${site.shortName}`, template: `%s | ${site.shortName}` },
    description: t.heroIntro,
    alternates: await pageAlternates("/", locale),
    openGraph: { type: "website", locale: localeConfig[locale].htmlLang, siteName: site.name, url: `${site.url}/${locale}` },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: LocaleParams & { children: React.ReactNode }) {
  const locale = toLocale(params.locale);
  // Dil panelden kapatilmissa dogrudan linkle bile girilemez.
  if (!(await getEnabledLocales()).includes(locale)) notFound();

  return <RootDocument locale={locale}>{children}</RootDocument>;
}
