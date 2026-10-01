import Link from "next/link";
import JsonLd from "@/shared/components/JsonLd";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { getLandingContent, type LandingPage } from "@/features/content/landing";
import { getSiteSettings } from "@/features/content/queries";
import { faqJsonLd } from "@/features/content/structured-data";
import LeadForm from "@/features/leads/components/LeadForm";
import RoomCard from "@/features/rooms/components/RoomCard";
import { getRooms } from "@/features/rooms/queries";
import FloatingCta from "@/features/site/components/FloatingCta";
import Footer from "@/features/site/components/Footer";
import Header from "@/features/site/components/Header";

const FEATURED_ROOM_COUNT = 4;

const TR_LABELS = {
  viewRooms: "Daireleri inceleyin",
  roomsHeading: "Uygun dairelerimiz",
  viewAll: "Tümünü görün",
  faqHeading: "Sıkça sorulan sorular",
};

/** SEO acilis sayfalarinin (gunluk / aylik / ogrenci) ortak sablonu. */
export default async function LandingTemplate({ page, locale }: { page: LandingPage; locale?: Locale }) {
  const [content, rooms, settings] = await Promise.all([getLandingContent(page, locale), getRooms(), getSiteSettings()]);
  const t = getDictionary(locale);
  const labels = locale ? { viewRooms: t.common.viewDetails, roomsHeading: t.home.featuredRooms, viewAll: t.common.viewAll, faqHeading: t.home.faqTitle } : TR_LABELS;
  const roomsHref = `${locale ? `/${locale}` : ""}/odalar`;

  return (
    <>
      <Header locale={locale} />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-14">
            <h1 className="max-w-[24ch] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{content.h1}</h1>
            <p className="lede mt-4 max-w-[62ch] text-[17px]">{content.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${settings.phoneHref}`} className="btn-primary">
                {settings.phoneDisplay}
              </a>
              <Link href={roomsHref} className="btn-outline">
                {labels.viewRooms}
              </Link>
            </div>
          </div>
        </section>

        <section className="container-page py-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {content.bullets.map((b) => (
              <div key={b.title} className="card p-5">
                <h2 className="font-extrabold tracking-tight">{b.title}</h2>
                <p className="mt-2 text-sm text-ink-soft">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {rooms.length > 0 && (
          <section className="border-y border-line bg-brand-50/60 py-14">
            <div className="container-page">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="h2">{labels.roomsHeading}</h2>
                <Link href={roomsHref} className="btn-outline">
                  {labels.viewAll}
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rooms.slice(0, FEATURED_ROOM_COUNT).map((r) => (
                  <RoomCard key={r.id} room={r} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
          <div className="max-w-[70ch] space-y-8">
            {content.body.map((b) => (
              <div key={b.heading}>
                <h2 className="text-xl font-extrabold tracking-tight">{b.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{b.text}</p>
              </div>
            ))}

            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{labels.faqHeading}</h2>
              <div className="mt-4 space-y-3">
                {content.faqs.map((f) => (
                  <details key={f.q} className="card p-5">
                    <summary className="cursor-pointer font-bold">{f.q}</summary>
                    <p className="mt-3 text-sm text-ink-soft">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <LeadForm phoneDisplay={settings.phoneDisplay} labels={t.lead} />
          </aside>
        </section>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
      <JsonLd data={faqJsonLd(content.faqs.map((f) => ({ question: f.q, answer: f.a })))} />
    </>
  );
}
