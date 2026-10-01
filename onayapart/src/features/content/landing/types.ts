import type { Locale } from "@/shared/i18n/config";

export type LandingContent = {
  h1: string;
  intro: string;
  bullets: { title: string; text: string }[];
  body: { heading: string; text: string }[];
  faqs: { q: string; a: string }[];
};

/** Bir SEO acilis sayfasi: Turkce asil metin + desteklenen her dildeki cevirisi. */
export type LandingPage = {
  /** Turkce adres; diger dillerde basina /<dil> eklenir. */
  path: string;
  /** Turkce sayfanin arama sonucu basligi ve aciklamasi. */
  seo: { title: string; description: string };
  tr: LandingContent;
  translations: Record<Locale, LandingContent>;
};
