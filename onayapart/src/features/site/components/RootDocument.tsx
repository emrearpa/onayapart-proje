import JsonLd from "@/shared/components/JsonLd";
import { defaultLocale, localeConfig, type Locale } from "@/shared/i18n/config";
import { manrope } from "@/shared/lib/fonts";
import { getSiteSettings } from "@/features/content/queries";
import { businessJsonLd } from "@/features/content/structured-data";

/** Her iki kok layout'un ((tr) ve [locale]) ortak <html> iskeleti. */
export default async function RootDocument({ children, locale }: { children: React.ReactNode; locale?: Locale }) {
  const settings = await getSiteSettings();
  const { htmlLang, dir } = locale ? localeConfig[locale] : { htmlLang: defaultLocale, dir: "ltr" as const };

  return (
    <html lang={htmlLang} dir={dir} className={manrope.variable}>
      <body>
        {children}
        <JsonLd data={businessJsonLd(settings, locale ? `/${locale}` : "")} />
      </body>
    </html>
  );
}
