import type { Metadata } from "next";
import JsonLd from "@/shared/components/JsonLd";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site } from "@/shared/lib/site";
import { getLocalizedFaqs } from "@/features/content/localized";
import { pageAlternates } from "@/features/content/seo";
import { faqJsonLd } from "@/features/content/structured-data";
import FaqList from "@/features/site/components/FaqList";
import SiteShell from "@/features/site/components/SiteShell";

const PATH = "/sss";

export async function faqMetadata(locale?: Locale): Promise<Metadata> {
  const t = getDictionary(locale);
  return { title: `${t.home.faqTitle} — ${site.name}`, alternates: await pageAlternates(PATH, locale) };
}

export default async function FaqView({ locale }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const faqs = await getLocalizedFaqs(locale);

  return (
    <SiteShell locale={locale}>
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.home.faqTitle}</h1>
          <div className="mt-8">
            {faqs.length === 0 ? <p className="text-sm text-ink-soft">{t.ui.noFaqs}</p> : <FaqList faqs={faqs} />}
          </div>
        </div>
      </main>
      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
    </SiteShell>
  );
}
