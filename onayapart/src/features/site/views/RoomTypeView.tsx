import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site } from "@/shared/lib/site";
import { localizeOne } from "@/features/content/localized";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import LeadForm from "@/features/leads/components/LeadForm";
import RateTable from "@/features/rooms/components/RateTable";
import RoomCard from "@/features/rooms/components/RoomCard";
import { getRoomType, getRooms } from "@/features/rooms/queries";
import SiteShell from "@/features/site/components/SiteShell";

const META_DESCRIPTION_LENGTH = 155;

async function getLocalizedType(slug: string, locale?: Locale) {
  const type = await getRoomType(slug);
  return type ? localizeOne("RoomType", type, ["name", "tagline", "description", "capacity", "features"], locale) : null;
}

export async function roomTypeMetadata(slug: string, locale?: Locale): Promise<Metadata> {
  const type = await getLocalizedType(slug, locale);
  if (!type) return {};
  return {
    // SEO basligi/metni yalnizca Turkce girilir; diger dillerde cevrilmis ad ve aciklama kullanilir.
    title: `${locale ? type.name : type.seoTitle} — ${site.name}`,
    description: (locale ? type.description : type.seoText).slice(0, META_DESCRIPTION_LENGTH),
    alternates: await pageAlternates(`/odalar/${type.slug}`, locale),
  };
}

export default async function RoomTypeView({ slug, locale }: { slug: string; locale?: Locale }) {
  const t = getDictionary(locale);
  const prefix = locale ? `/${locale}` : "";

  const [type, rooms, settings] = await Promise.all([getLocalizedType(slug, locale), getRooms(slug), getSiteSettings()]);
  if (!type) notFound();

  const heading = locale ? type.name : type.seoTitle;
  const facts = [`${type.minM2}–${type.maxM2} m²`, type.capacity, `${rooms.length} ${t.ui.units}`];

  return (
    <SiteShell locale={locale}>
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <nav aria-label="breadcrumb" className="text-xs text-ink-soft">
              <Link href={`${prefix}/odalar`} className="hover:text-brand-500">
                {t.rooms.title}
              </Link>{" "}
              / {type.name}
            </nav>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{heading}</h1>
            <p className="lede mt-3 max-w-[62ch]">{type.description || type.tagline}</p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {facts.map((fact) => (
                <span key={fact} className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold">
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="h2">{type.name}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room, i) => (
                <RoomCard key={room.id} room={room} priority={i < 3} locale={locale} />
              ))}
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{t.ui.features}</h2>
                <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                  {type.features
                    .split("\n")
                    .filter(Boolean)
                    .map((feature) => (
                      <li key={feature} className="relative pl-6">
                        <span className="absolute left-0 font-extrabold text-brand-500">✓</span>
                        {feature}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{t.roomDetail.ratesTitle}</h2>
                <div className="mt-4">
                  <RateTable rates={type.rates} locale={locale} />
                </div>
              </div>
            </div>

            {!locale && type.seoText && (
              <div className="mt-12 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
                <h2 className="text-xl font-extrabold tracking-tight text-ink">{type.seoTitle} hakkında</h2>
                <p className="mt-3">{type.seoText}</p>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <LeadForm phoneDisplay={settings.phoneDisplay} labels={t.lead} />
          </aside>
        </section>
      </main>
    </SiteShell>
  );
}
