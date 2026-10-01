import Link from "next/link";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import RoomCard from "@/features/rooms/components/RoomCard";
import LeadForm from "@/features/leads/components/LeadForm";
import JsonLd from "@/shared/components/JsonLd";
import { getRooms } from "@/features/rooms/queries";
import { getSiteSettings } from "@/features/content/queries";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";

export type LandingContent = {
  h1: string;
  intro: string;
  bullets: { title: string; text: string }[];
  body: { heading: string; text: string }[];
  faqs: { q: string; a: string }[];
  path: string;
};

export default async function LandingTemplate({ content, locale }: { content: LandingContent; locale?: Locale }) {
  const [rooms, settings] = await Promise.all([getRooms(), getSiteSettings()]);
  const featured = rooms.slice(0, 4);
  const prefix = locale ? `/${locale}` : "";
  const t = locale ? getDictionary(locale) : null;

  const viewRoomsLabel = t ? t.common.viewDetails : "Daireleri inceleyin";
  const availableRoomsHeading = t ? t.home.featuredRooms : "Uygun dairelerimiz";
  const viewAllLabel = t ? t.common.viewAll : "Tümünü görün";
  const faqHeading = t ? t.home.faqTitle : "Sıkça sorulan sorular";
  const roomLabels = locale
    ? {
        room: locale === "en" ? "Room" : locale === "ru" ? "Номер" : locale === "ar" ? "غرفة" : locale === "de" ? "Zimmer" : locale === "fr" ? "Chambre" : locale === "es" ? "Habitación" : locale === "az" ? "Otaq" : locale === "ka" ? "ოთახი" : "اتاق",
        floor: locale === "en" ? " floor" : locale === "ru" ? " этаж" : locale === "ar" ? " طابق" : locale === "de" ? " Etage" : locale === "fr" ? " étage" : locale === "es" ? " piso" : locale === "az" ? " mərtəbə" : locale === "ka" ? " სართული" : " طبقه",
      }
    : undefined;

  return (
    <>
      <Header locale={locale} />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-14">
            <h1 className="max-w-[24ch] text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {content.h1}
            </h1>
            <p className="lede mt-4 max-w-[62ch] text-[17px]">{content.intro}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`tel:${settings.phoneHref}`} className="btn-primary">{settings.phoneDisplay}</a>
              <Link href={`${prefix}/odalar`} className="btn-outline">{viewRoomsLabel}</Link>
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

        <section className="border-y border-line bg-brand-50/60 py-14">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="h2">{availableRoomsHeading}</h2>
              <Link href={`${prefix}/odalar`} className="btn-outline">{viewAllLabel}</Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((r) => (
                <RoomCard key={r.id} room={r} hrefPrefix={prefix} labels={roomLabels} />
              ))}
            </div>
          </div>
        </section>

        <section className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_320px]">
          <div className="max-w-[70ch] space-y-8">
            {content.body.map((b) => (
              <div key={b.heading}>
                <h2 className="text-xl font-extrabold tracking-tight">{b.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{b.text}</p>
              </div>
            ))}

            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{faqHeading}</h2>
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
            <LeadForm phoneDisplay={settings.phoneDisplay} labels={t?.lead} />
          </aside>
        </section>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    </>
  );
}
