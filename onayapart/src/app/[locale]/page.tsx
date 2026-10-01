import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import RoomCard from "@/features/rooms/components/RoomCard";
import TypeCards from "@/features/rooms/components/TypeCards";
import { getRoomTypes, getRooms, getAmenities } from "@/features/rooms/queries";
import { getSiteSettings, getFaqs, getTestimonials } from "@/features/content/queries";
import { getMenu } from "@/features/menu/queries";
import { fullAddress, mapsLink } from "@/shared/lib/site";
import { fmtMoney } from "@/shared/lib/dates";
import { isLocale, type Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { getBatchTranslations, withFallback } from "@/features/content/translations";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getDictionary(params.locale);
  return {
    title: `${t.home.heroTitle} — Onay Apart`,
    description: t.home.heroIntro,
  };
}

export default async function LocaleHomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);
  const prefix = `/${locale}`;

  const [types, rooms, settings, amenities, faqs, menu, testimonials] = await Promise.all([
    getRoomTypes(),
    getRooms(),
    getSiteSettings(),
    getAmenities(),
    getFaqs(true),
    getMenu(),
    getTestimonials(),
  ]);

  const [amenityT, faqT] = await Promise.all([
    getBatchTranslations("Amenity", amenities.map((a) => a.id), locale),
    getBatchTranslations("Faq", faqs.map((f) => f.id), locale),
  ]);
  const typeT = await getBatchTranslations("RoomType", types.map((ty) => ty.id), locale);
  const typeCardLabels = {
    units:
      locale === "en" ? "units" : locale === "ru" ? "апарт." : locale === "ar" ? "شقة" : locale === "de" ? "Einheiten" : locale === "fr" ? "unités" : locale === "es" ? "unidades" : locale === "az" ? "mənzil" : locale === "ka" ? "ერთეული" : "واحد",
    available:
      locale === "en" ? "available" : locale === "ru" ? "свободно" : locale === "ar" ? "متاحة" : locale === "de" ? "verfügbar" : locale === "fr" ? "disponibles" : locale === "es" ? "disponibles" : locale === "az" ? "boş" : locale === "ka" ? "თავისუფალი" : "خالی",
    viewRooms: t.common.viewDetails,
    callForPrice:
      locale === "en" ? "Call for price" : locale === "ru" ? "Цена по запросу" : locale === "ar" ? "اتصل للسعر" : locale === "de" ? "Preis auf Anfrage" : locale === "fr" ? "Prix sur demande" : locale === "es" ? "Precio a consultar" : locale === "az" ? "Qiymət üçün zəng edin" : locale === "ka" ? "დარეკეთ ფასისთვის" : "برای قیمت تماس بگیرید",
  };

  const featured = rooms.slice(0, 8);
  const roomCount = types.reduce((s, ty) => s + ty.rooms.length, 0);
  const roomWord = locale === "en" ? "Room" : locale === "ru" ? "Номер" : locale === "ar" ? "غرفة" : locale === "de" ? "Zimmer" : locale === "fr" ? "Chambre" : locale === "es" ? "Habitación" : locale === "az" ? "Otaq" : locale === "ka" ? "ოთახი" : "اتاق";
  const floorWord = locale === "en" ? " floor" : locale === "ru" ? " этаж" : locale === "ar" ? " طابق" : locale === "de" ? " Etage" : locale === "fr" ? " étage" : locale === "es" ? " piso" : locale === "az" ? " mərtəbə" : locale === "ka" ? " სართული" : " طبقه";
  const roomLabels = { room: roomWord, floor: floorWord };

  return (
    <>
      <Header locale={locale} />

      <main>
        <section className="border-b border-line bg-gradient-to-b from-brand-50 to-white">
          <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-brand-600">
                {t.home.heroEyebrow}
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                {t.home.heroTitle}
              </h1>

              <p className="mt-4 max-w-[54ch] text-[17px] text-ink-soft">{t.home.heroIntro}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`${prefix}/odalar`} className="btn-primary">
                  {t.home.heroCta}
                </Link>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" className="btn-wa">
                  {t.common.whatsapp}
                </a>
              </div>

              <dl className="mt-9 flex flex-wrap gap-7">
                {[
                  [String(roomCount), t.rooms.title],
                  [String(types.length), t.nav.rooms],
                  ["7/24", locale === "ar" ? "أمن" : locale === "fa" ? "امنیت" : locale === "ru" ? "Охрана" : "Security"],
                  [settings.addressDistrict, settings.addressCity],
                ].map(([v, l]) => (
                  <div key={l} className="border-l-[3px] border-brand-300 pl-3">
                    <dt className="text-xl font-extrabold tracking-tight">{v}</dt>
                    <dd className="text-xs text-ink-soft">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              {settings.heroImageUrl ? (
                <div className="relative aspect-[4/3]">
                  <Image src={settings.heroImageUrl} alt="Onay Apart Rezidans" fill priority className="object-cover" />
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-brand-700 via-brand-500 to-brand-300 text-center text-white">
                  <div>
                    <div className="text-5xl">🏢</div>
                    <strong className="mt-2 block text-lg">Onay Apart Rezidans</strong>
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-3 px-5 py-4 text-[13px] text-ink-soft">
                <span>{settings.addressStreet}</span>
                <span>{settings.addressPostalCode} {settings.addressDistrict}</span>
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
            <TypeCards types={types} hrefPrefix={prefix} translations={typeT} labels={typeCardLabels} />
          </div>
        </section>

        <section className="border-y border-line bg-brand-50/60 py-16">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="h2">{t.rooms.title}</h2>
              </div>
              <Link href={`${prefix}/odalar`} className="btn-outline">
                {t.common.viewAll}
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((r, i) => (
                <RoomCard key={r.id} room={r} priority={i < 4} hrefPrefix={prefix} labels={roomLabels} />
              ))}
            </div>
          </div>
        </section>

        {settings.menuEnabled && (menu.dailySpecials.length > 0 || menu.categories.length > 0) && (
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

              {menu.dailySpecials.length > 0 && (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold-500">{t.home.dailySpecial}</h3>
                  <ul className="mt-3 divide-y divide-white/10">
                    {menu.dailySpecials.slice(0, 4).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="font-semibold">{item.name}</span>
                        <span className="shrink-0 font-extrabold text-gold-400">{fmtMoney(item.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="container-page py-16">
          <div className="max-w-2xl">
            <h2 className="h2">{t.home.amenitiesTitle}</h2>
            <p className="lede mt-3">{t.home.amenitiesSub}</p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((a) => (
              <li key={a.id} className="card px-4 py-4 text-sm font-semibold">
                {withFallback(a.label, amenityT[a.id]?.label)}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-brand-50/60 py-16">
          <div className="container-page grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="h2">{t.home.mapTitle}</h2>
              <p className="lede mt-3">{fullAddress(settings)}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={mapsLink(settings)} target="_blank" rel="noopener" className="btn-primary">
                  {t.common.viewDetails}
                </a>
                <a href={`tel:${settings.phoneHref}`} className="btn-outline">
                  {settings.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="grid aspect-[16/11] place-items-center bg-[repeating-linear-gradient(0deg,#e0e9e3_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,#e0e9e3_0_1px,transparent_1px_42px)]">
                <span className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card">
                  📍 Onay Apart Rezidans
                </span>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="border-y border-line bg-white py-16">
            <div className="container-page">
              <div className="max-w-2xl">
                <h2 className="h2">{t.home.testimonialsTitle}</h2>
                <p className="lede mt-3">{t.home.testimonialsSub}</p>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((tm) => (
                  <div key={tm.id} className="rounded-2xl border border-line bg-brand-50/30 p-6">
                    <div className="text-gold-500" aria-hidden>
                      {"★".repeat(tm.rating)}
                      {"☆".repeat(5 - tm.rating)}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{tm.text}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                        {tm.authorName.charAt(0).toUpperCase()}
                      </span>
                      <div className="text-sm font-bold">{tm.authorName}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="container-page py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="h2">{t.home.faqTitle}</h2>
              <div className="mt-8 space-y-3">
                {faqs.map((f) => (
                  <details key={f.id} className="card p-5">
                    <summary className="cursor-pointer font-bold">{withFallback(f.question, faqT[f.id]?.question)}</summary>
                    <p className="mt-3 text-sm text-ink-soft">{withFallback(f.answer, faqT[f.id]?.answer)}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
