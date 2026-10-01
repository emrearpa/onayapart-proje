import { fullAddress, site } from "@/shared/lib/site";

// schema.org yapilandirilmis verileri (JSON-LD). Arama motorlarina isletmeyi,
// sik sorulan sorulari ve daireleri makinece okunur bicimde anlatir.

type Faq = { question: string; answer: string };

export function faqJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

type BusinessSettings = {
  phoneHref: string;
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
  addressPostalCode: string;
  heroImageUrl: string | null;
};

/** Isletmenin kendisi; her sayfanin layout'unda bir kez basilir. */
export function businessJsonLd(settings: BusinessSettings, pathPrefix = "") {
  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: site.name,
    url: `${site.url}${pathPrefix}`,
    telephone: settings.phoneHref,
    ...(settings.heroImageUrl ? { image: new URL(settings.heroImageUrl, site.url).toString() } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressStreet,
      addressLocality: settings.addressDistrict,
      addressRegion: settings.addressCity,
      postalCode: settings.addressPostalCode,
      addressCountry: "TR",
    },
    description: fullAddress(settings),
  };
}
