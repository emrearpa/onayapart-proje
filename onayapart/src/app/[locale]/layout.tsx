import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import "../globals.css";
import { site } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { isLocale, localeConfig, parseEnabledLocales, type Locale } from "@/shared/i18n/config";
import JsonLd from "@/shared/components/JsonLd";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const locale = params.locale;
  const settings = await getSiteSettings();
  const enabledLocales = parseEnabledLocales(settings.enabledLocales);

  const languageAlternates: Record<string, string> = { "x-default": "/", tr: "/" };
  for (const l of enabledLocales) languageAlternates[l] = `/${l}`;

  return {
    metadataBase: new URL(site.url),
    alternates: { canonical: `/${locale}`, languages: languageAlternates },
    openGraph: { locale: localeConfig[locale].htmlLang },
    robots: { index: enabledLocales.includes(locale), follow: enabledLocales.includes(locale) },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const { dir, htmlLang } = localeConfig[locale];
  const settings = await getSiteSettings();

  // Bu dil bu site icin kapatilmissa (panelden), dogrudan linkle bile girilemez.
  const enabledLocales = parseEnabledLocales(settings.enabledLocales);
  if (!enabledLocales.includes(locale)) notFound();

  return (
    <html lang={htmlLang} dir={dir} className={manrope.variable}>
      <body>
        {children}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ApartmentComplex",
            name: site.name,
            url: `${site.url}/${locale}`,
            telephone: settings.phoneHref,
            image: `${site.url}/og.jpg`,
            address: {
              "@type": "PostalAddress",
              streetAddress: settings.addressStreet,
              addressLocality: settings.addressDistrict,
              addressRegion: settings.addressCity,
              postalCode: settings.addressPostalCode,
              addressCountry: "TR",
            },
          }}
        />
      </body>
    </html>
  );
}
