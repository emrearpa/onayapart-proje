import type { Metadata } from "next";
import { isLocale, type Locale } from "@/shared/i18n/config";
import { fillPlaceholders } from "@/shared/lib/text";
import { site } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import type { LandingContent, LandingPage } from "@/features/content/landing/types";

export type { LandingContent, LandingPage } from "@/features/content/landing/types";

const META_DESCRIPTION_LENGTH = 155;

/** Metindeki {phone} gibi yer tutuculari panelden yonetilen guncel degerlerle doldurur. */
function fillContent(content: LandingContent, vars: Record<string, string>): LandingContent {
  const fill = (text: string) => fillPlaceholders(text, vars);
  return {
    h1: fill(content.h1),
    intro: fill(content.intro),
    bullets: content.bullets.map((b) => ({ title: fill(b.title), text: fill(b.text) })),
    body: content.body.map((b) => ({ heading: fill(b.heading), text: fill(b.text) })),
    faqs: content.faqs.map((f) => ({ q: fill(f.q), a: fill(f.a) })),
  };
}

/** Sayfanin istenen dildeki, yer tutuculari doldurulmus icerigi. */
export async function getLandingContent(page: LandingPage, locale?: Locale): Promise<LandingContent> {
  const { phoneDisplay } = await getSiteSettings();
  return fillContent(locale ? page.translations[locale] : page.tr, { phone: phoneDisplay });
}

export async function landingMetadata(page: LandingPage, locale?: string): Promise<Metadata> {
  if (locale !== undefined && !isLocale(locale)) return {};

  const [content, alternates, { phoneDisplay }] = await Promise.all([
    getLandingContent(page, locale),
    pageAlternates(page.path, locale),
    getSiteSettings(),
  ]);

  if (!locale) {
    return { title: page.seo.title, description: fillPlaceholders(page.seo.description, { phone: phoneDisplay }), alternates };
  }
  return { title: `${content.h1} — ${site.shortName}`, description: content.intro.slice(0, META_DESCRIPTION_LENGTH), alternates };
}
