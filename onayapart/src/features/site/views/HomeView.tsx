import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/shared/components/JsonLd";
import SmartImage from "@/shared/components/SmartImage";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { fmtMoney } from "@/shared/lib/dates";
import { fullAddress, mapsLink, site, waLink } from "@/shared/lib/site";
import { getLocalizedFaqs, localize, localizeOne } from "@/features/content/localized";
import { getSiteSettings, getTestimonials } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import { faqJsonLd } from "@/features/content/structured-data";
import { getMenu } from "@/features/menu/queries";
import RoomCard from "@/features/rooms/components/RoomCard";
import TypeCards from "@/features/rooms/components/TypeCards";
import { getAmenities, getRoomTypes, getRooms } from "@/features/rooms/queries";
import FaqList from "@/features/site/components/FaqList";
import LocationMap from "@/features/site/components/LocationMap";
import SiteShell from "@/features/site/components/SiteShell";

const FEATURED_ROOM_COUNT = 8;
const DAILY_SPECIAL_COUNT = 4;
const HERO_FIELDS: ("heroEyebrow" | "heroTitle" | "heroIntro")[] = ["heroEyebrow", "heroTitle", "heroIntro"];

/** Ana sayfa metni: Turkcesi panelden gelir; diger dillerde paneldeki ceviri, o da yoksa sozlukteki hazir metin. */
async function getHero(locale?: Locale) {
  const settings = await getSiteSettings();
  if (!locale) return settings;

  const t = getDictionary(locale).home;
  const defaults = { ...settings, heroEyebrow: t.heroEyebrow, heroTitle: t.heroTitle, heroIntro: t.heroIntro };
  return localizeOne("SiteSetting", defaults, HERO_FIELDS, locale);
}

export async function homeMetadata(locale?: Locale): Promise<Metadata> {
  const [hero, alternates] = await Promise.all([getHero(locale), pageAlternates("/", locale)]);
  return { title: { absolute: `${hero.heroTitle} | ${site.shortName}` }, description: hero.heroIntro, alternates };
}

export default async function HomeView({ locale }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const prefix = locale ? `/${locale}` : "";

  const [types, rooms, hero, allAmenities, faqs, menu, testimonials] = await Promise.all([
    getRoomTypes(),
    getRooms(),
    getHero(locale),
    getAmenities(),
    getLocalizedFaqs(locale, true),
    getMenu(),
    getTestimonials(),
  ]);
  const [amenities, dailySpecials] = await Promise.all([
    localize("Amenity", allAmenities, ["label"], locale),
    localize("MenuItem", menu.dailySpecials.slice(0, DAILY_SPECIAL_COUNT), ["name"], locale),
  ]);

  const stats = [
    [String(rooms.length), t.ui.apartments],
    [String(types.length), t.ui.roomTypes],
    [hero.addressDistrict, hero.addressCity],
  ];
  const showRestaurant = hero.menuEnabled && menu.categories.length > 0;

  return (
    <SiteShell locale={locale}>
      <main>
        <section className="border-b border-line bg-gradient-to-b from-brand-50 to-white">
          <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-brand-600">
                {hero.heroEyebrow}
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">{hero.heroTitle}</h1>
              <p className="mt-4 max-w-[54ch] text-[17px] text-ink-soft">{hero.heroIntro}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`${prefix}/odalar`} className="btn-primary">
                  {t.home.heroCta}
                </Link>
                <a href={waLink(hero.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn-wa">
                  {t.common.whatsapp}
                </a>
              </div>

              <dl className="mt-9 flex flex-wrap gap-7">
                {stats.map(([value, label]) => (
                  <div key={label} className="border-l-[3px] border-brand-300 pl-3">
                    <dt className="text-xl font-extrabold tracking-tight">{value}</dt>
                    <dd className="text-xs text-ink-soft">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              <div className="relative grid aspect-[4/3] place-items-center bg-gradient-to-br from-brand-700 via-brand-500 to-brand-300 text-white">
                {hero.heroImageUrl ? (
                  <SmartImage src={hero.heroImageUrl} alt={site.name} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <strong className="px-6 text-center text-2xl font-extrabold tracking-tight">{site.name}</strong>
                )}
              </div>
              <div className="flex justify-between gap-3 px-5 py-4 text-[13px] text-ink-soft">
                <span>{hero.addressStreet}</span>
                <span>
                  {hero.addressPostalCode} {hero.addressDistrict}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-16">
          <div className="max-w-2xl">
            <h2 className="h2">{t.home.featuredRooms}</h2>
            <p className="lede mt-3">{t.home.featuredRoomsSub}</p>
          </div>
          <div className="mt-8">
            <TypeCards types={types} locale={locale} />
          </div>
        </section>

        {rooms.length > 0 && (
          <section className="border-y border-line bg-brand-50/60 py-16">
            <div className="container-page">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="h2">{t.rooms.title}</h2>
                <Link href={`${prefix}/odalar`} className="btn-outline">
                  {t.common.viewAll}
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rooms.slice(0, FEATURED_ROOM_COUNT).map((room, i) => (
                  <RoomCard key={room.id} room={room} priority={i < 4} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        )}

        {showRestaurant && (
          <section className="border-y border-line bg-brand-900 py-16 text-white">
            <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-gold-500">{t.home.restaurantEyebrow}</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{t.home.restaurantTitle}</h2>
                <p className="mt-3 text-white/70">{t.home.restaurantText}</p>
                <Link href={`${prefix}/menu`} className="btn-primary mt-5 inline-block">
                  {t.home.restaurantCta}
                </Link>
              </div>

              {dailySpecials.length > 0 && (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold-500">{t.home.dailySpecial}</h3>
                  <ul className="mt-3 divide-y divide-white/10">
                    {dailySpecials.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="font-semibold">{item.name}</span>
                        <span className="shrink-0 font-extrabold text-gold-500">{fmtMoney(item.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {amenities.length > 0 && (
          <section className="container-page py-16">
            <div className="max-w-2xl">
              <h2 className="h2">{t.home.amenitiesTitle}</h2>
              <p className="lede mt-3">{t.home.amenitiesSub}</p>
            </div>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {amenities.map((amenity) => (
                <li key={amenity.id} className="card px-4 py-4 text-sm font-semibold">
                  {amenity.label}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="border-y border-line bg-brand-50/60 py-16">
          <div className="container-page grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="h2">{t.home.mapTitle}</h2>
              <p className="lede mt-3">{fullAddress(hero)}</p>
              <p className="mt-4 text-sm text-ink-soft">{t.ui.locationText}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={mapsLink(hero)} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  {t.ui.directions}
                </a>
                <a href={`tel:${hero.phoneHref}`} className="btn-outline">
                  {hero.phoneDisplay}
                </a>
              </div>
            </div>
            <LocationMap address={hero} />
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="border-b border-line bg-white py-16">
            <div className="container-page">
              <div className="max-w-2xl">
                <h2 className="h2">{t.home.testimonialsTitle}</h2>
                <p className="lede mt-3">{t.home.testimonialsSub}</p>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((review) => (
                  <figure key={review.id} className="rounded-2xl border border-line bg-brand-50/30 p-6">
                    <div className="text-gold-500" role="img" aria-label={`${review.rating} / 5`}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                    <blockquote className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{review.text}&rdquo;</blockquote>
                    <figcaption className="mt-4 flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                        {review.authorName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-bold">{review.authorName}</span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="container-page py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="h2">{t.home.faqTitle}</h2>
              <div className="mt-8">
                <FaqList faqs={faqs} />
              </div>
            </div>
          </section>
        )}
      </main>

      {faqs.length > 0 && <JsonLd data={faqJsonLd(faqs)} />}
    </SiteShell>
  );
}
