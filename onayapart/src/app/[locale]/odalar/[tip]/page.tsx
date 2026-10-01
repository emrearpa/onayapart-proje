import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import RoomCard from "@/components/RoomCard";
import LeadForm from "@/components/LeadForm";
import { getRoomType, getRooms, getSiteSettings } from "@/lib/queries";
import { fmtMoney } from "@/lib/dates";
import { getRecordTranslations, withFallback } from "@/lib/translations";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

type Props = { params: { locale: string; tip: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const type = await getRoomType(params.tip);
  if (!type) return {};
  const tr = await getRecordTranslations("RoomType", type.id);
  const name = withFallback(type.name, tr[params.locale as Locale]?.name);
  return {
    title: `${name} — Onay Apart`,
    alternates: { canonical: `/${params.locale}/odalar/${type.slug}` },
  };
}

export default async function LocaleTypePage({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);
  const prefix = `/${locale}`;

  const [type, settings] = await Promise.all([getRoomType(params.tip), getSiteSettings()]);
  if (!type) notFound();
  const rooms = await getRooms(params.tip);
  const tr = await getRecordTranslations("RoomType", type.id);
  const localeTr = tr[locale] ?? {};

  const name = withFallback(type.name, localeTr.name);
  const tagline = withFallback(type.tagline, localeTr.tagline);
  const description = withFallback(type.description, localeTr.description);
  const capacity = withFallback(type.capacity, localeTr.capacity);
  const features = withFallback(type.features, localeTr.features);

  const roomWord = locale === "en" ? "Room" : locale === "ru" ? "Номер" : locale === "ar" ? "غرفة" : locale === "de" ? "Zimmer" : locale === "fr" ? "Chambre" : locale === "es" ? "Habitación" : locale === "az" ? "Otaq" : locale === "ka" ? "ოთახი" : "اتاق";
  const floorWord = locale === "en" ? " floor" : locale === "ru" ? " этаж" : locale === "ar" ? " طابق" : locale === "de" ? " Etage" : locale === "fr" ? " étage" : locale === "es" ? " piso" : locale === "az" ? " mərtəbə" : locale === "ka" ? " სართული" : " طبقه";
  const unitsWord = locale === "en" ? "units" : locale === "ru" ? "апарт." : locale === "ar" ? "شقة" : locale === "de" ? "Einheiten" : locale === "fr" ? "unités" : locale === "es" ? "unidades" : locale === "az" ? "mənzil" : locale === "ka" ? "ერთეული" : "واحد";
  const featuresHeading =
    locale === "en" ? "Apartment features" : locale === "ru" ? "Особенности апартаментов" : locale === "ar" ? "مميزات الشقة" : locale === "de" ? "Ausstattungsmerkmale" : locale === "fr" ? "Caractéristiques de l'appartement" : locale === "es" ? "Características del apartamento" : locale === "az" ? "Mənzil xüsusiyyətləri" : locale === "ka" ? "ბინის მახასიათებლები" : "امکانات آپارتمان";
  const pricingHeading =
    locale === "en" ? "Rates" : locale === "ru" ? "Тарифы" : locale === "ar" ? "الأسعار" : locale === "de" ? "Preise" : locale === "fr" ? "Tarifs" : locale === "es" ? "Tarifas" : locale === "az" ? "Qiymətlər" : locale === "ka" ? "ფასები" : "نرخ‌ها";
  const callWord = locale === "en" ? "Call" : locale === "ru" ? "Звонок" : locale === "ar" ? "اتصل" : locale === "de" ? "Anruf" : locale === "fr" ? "Appel" : locale === "es" ? "Llamar" : locale === "az" ? "Zəng" : locale === "ka" ? "ზარი" : "تماس";

  return (
    <>
      <Header locale={locale} />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <nav className="text-xs text-ink-soft">
              <Link href={`${prefix}/odalar`} className="hover:text-brand-500">
                {t.rooms.title}
              </Link>{" "}
              / {name}
            </nav>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
            <p className="lede mt-3 max-w-[62ch]">{description || tagline}</p>

            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              {[`${type.minM2}–${type.maxM2} m²`, capacity, `${rooms.length} ${unitsWord}`].map((x) => (
                <span key={x} className="rounded-full border border-line bg-white px-3.5 py-1.5 font-semibold">
                  {x}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="h2">{name}</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((r, i) => (
                <RoomCard key={r.id} room={r} priority={i < 3} hrefPrefix={prefix} labels={{ room: roomWord, floor: floorWord }} />
              ))}
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{featuresHeading}</h2>
                <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                  {features.split("\n").filter(Boolean).map((f) => (
                    <li key={f} className="relative pl-6">
                      <span className="absolute left-0 font-extrabold text-brand-500">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{pricingHeading}</h2>
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {type.rates.map((r) => (
                      <tr key={r.id} className="border-b border-line">
                        <td className="py-2.5">{r.label}</td>
                        <td className="py-2.5 text-right font-bold">{r.price ? fmtMoney(r.price) : callWord}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    </>
  );
}
