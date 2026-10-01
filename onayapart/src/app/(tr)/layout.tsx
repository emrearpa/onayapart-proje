import type { Metadata, Viewport } from "next";
import "../globals.css";
import { site } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import RootDocument from "@/features/site/components/RootDocument";

export const viewport: Viewport = { themeColor: "#1c6045" };

export async function generateMetadata(): Promise<Metadata> {
  const [settings, alternates] = await Promise.all([getSiteSettings(), pageAlternates("/")]);
  const city = settings.addressCity;
  const cityLower = city.toLocaleLowerCase("tr");

  return {
    metadataBase: new URL(site.url),
    title: { default: `${settings.heroTitle} | ${site.shortName}`, template: `%s | ${site.shortName} ${city}` },
    description: settings.heroIntro,
    keywords: [
      `${cityLower} apart`,
      `${cityLower} apart daire`,
      `${cityLower} kiralık apart`,
      `günlük kiralık apart ${cityLower}`,
      `aylık kiralık apart ${cityLower}`,
      `${cityLower} öğrenci apart`,
      `${settings.addressDistrict.toLocaleLowerCase("tr")} apart`,
    ],
    alternates,
    openGraph: { type: "website", locale: "tr_TR", siteName: site.name, url: site.url },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument>{children}</RootDocument>;
}
