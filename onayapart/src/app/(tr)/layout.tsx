import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";
import { site, fullAddress } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import JsonLd from "@/shared/components/JsonLd";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Erzurum Apart | Onay Apart Rezidans – Günlük ve Aylık Kiralık Apart Daire",
    template: "%s | Onay Apart Erzurum",
  },
  description:
    "Erzurum apart arayanlar için Onay Apart Rezidans: Yakutiye merkezde 1+0, 1+1 ve 2+1 eşyalı apart daireler. Günlük, haftalık, aylık ve öğrenci dönemlik konaklama.",
  keywords: [
    "erzurum apart",
    "erzurum apart daire",
    "erzurum kiralık apart",
    "günlük kiralık apart erzurum",
    "aylık kiralık apart erzurum",
    "erzurum öğrenci apart",
    "yakutiye apart",
    "erzurum apart otel",
  ],
  alternates: { canonical: "/", languages: { "x-default": "/", tr: "/", en: "/en", ar: "/ar", fa: "/fa", ru: "/ru" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: site.name,
    url: site.url,
    title: "Erzurum Apart | Onay Apart Rezidans",
    description: "Yakutiye/Erzurum merkezde 1+0, 1+1, 2+1 eşyalı apart daireler.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html lang="tr" className={manrope.variable}>
      <body>
        {children}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ApartmentComplex",
            name: site.name,
            alternateName: "Onay Apart Erzurum",
            url: site.url,
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
            description: `Erzurum Yakutiye'de apart daire konaklaması. ${fullAddress(settings)}`,
          }}
        />
      </body>
    </html>
  );
}
