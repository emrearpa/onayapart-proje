import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import Gallery from "@/features/rooms/components/Gallery";
import LeadForm from "@/features/leads/components/LeadForm";
import StatusBadge from "@/features/rooms/components/StatusBadge";
import { placeholder } from "@/features/rooms/components/RoomPhoto";
import { getRoom, getAmenities } from "@/features/rooms/queries";
import { availabilityOf } from "@/features/rooms/availability";
import { getSiteSettings } from "@/features/content/queries";
import { getRecordTranslations, getBatchTranslations, withFallback } from "@/features/content/translations";
import { site, waLink } from "@/shared/lib/site";
import { fmtMoney } from "@/shared/lib/dates";
import { isLocale, type Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";

export const revalidate = 300;

type Props = { params: { locale: string; tip: string; oda: string } };

const PHOTO_LABELS = ["Salon", "Yatak odası", "Mutfak", "Banyo"];

function numberFromSlug(slug: string) {
  const n = Number(slug.replace(/^oda-/, ""));
  return Number.isFinite(n) ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const n = numberFromSlug(params.oda);
  if (!n) return {};
  const room = await getRoom(n);
  if (!room) return {};
  return { alternates: { canonical: `/${params.locale}/odalar/${room.type.slug}/oda-${room.number}` } };
}

export default async function LocaleRoomPage({ params }: Props) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);
  const prefix = `/${locale}`;

  const n = numberFromSlug(params.oda);
  if (!n) notFound();

  const room = await getRoom(n);
  if (!room || !room.isPublished || room.type.slug !== params.tip) notFound();

  const [settings, amenities] = await Promise.all([getSiteSettings(), getAmenities()]);

  const [roomTr, typeTr, amenityT] = await Promise.all([
    getRecordTranslations("Room", room.id),
    getRecordTranslations("RoomType", room.type.id),
    getBatchTranslations("Amenity", amenities.map((a) => a.id), locale),
  ]);
  const rTr = roomTr[locale] ?? {};
  const tyTr = typeTr[locale] ?? {};

  const typeName = withFallback(room.type.name, tyTr.name);
  const typeTagline = withFallback(room.type.tagline, tyTr.tagline);
  const beds = withFallback(room.beds, rTr.beds);
  const view = withFallback(room.view, rTr.view);

  const state = availabilityOf(room.condition, room.reservations, new Date(), room.externalBookings);
  const photos =
    room.photos.length > 0
      ? room.photos.map((p) => ({ url: p.url, alt: p.alt }))
      : PHOTO_LABELS.map((label, i) => ({
          url: placeholder(room.number, label, i),
          alt: `Onay Apart ${room.type.code} — ${room.number}`,
        }));

  const specs = [
    [t.roomDetail.roomNumber, String(room.number)],
    [t.roomDetail.floor, String(room.floor)],
    [t.roomDetail.size, `${room.m2} m²`],
    [t.roomDetail.capacity, room.type.capacity],
    [t.roomDetail.bedLayout, beds],
    [t.roomDetail.view, view],
  ];

  const selectedKeys = room.amenities ? room.amenities.split(",") : amenities.map((a) => a.icon);
  const roomAmenities = amenities.filter((a) => selectedKeys.includes(a.icon));

  const roomWord = locale === "en" ? "Room" : locale === "ru" ? "Номер" : locale === "ar" ? "غرفة" : locale === "de" ? "Zimmer" : locale === "fr" ? "Chambre" : locale === "es" ? "Habitación" : locale === "az" ? "Otaq" : locale === "ka" ? "ოთახი" : "اتاق";
  const callWord = locale === "en" ? "Call" : locale === "ru" ? "Звонок" : locale === "ar" ? "اتصل" : locale === "de" ? "Anruf" : locale === "fr" ? "Appel" : locale === "es" ? "Llamar" : locale === "az" ? "Zəng" : locale === "ka" ? "ზარი" : "تماس";

  return (
    <>
      <Header locale={locale} />
      <main className="container-page grid gap-10 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <nav className="mb-4 text-xs text-ink-soft">
            <Link href={`${prefix}/odalar`} className="hover:text-brand-500">
              {t.rooms.title}
            </Link>{" "}
            /{" "}
            <Link href={`${prefix}/odalar/${room.type.slug}`} className="hover:text-brand-500">
              {typeName}
            </Link>{" "}
            / {roomWord} {room.number}
          </nav>
          <Gallery photos={photos} />
        </div>

        <div>
          <StatusBadge state={state} label={t.availability[state]} />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {roomWord} {room.number} — {typeName}
          </h1>
          <p className="lede mt-2">
            {typeTagline}. {view}.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-brand-50/50 px-3.5 py-2.5">
                <dt className="text-[11px] text-ink-soft">{k}</dt>
                <dd className="text-sm font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">{t.roomDetail.amenitiesTitle}</h2>
          {roomAmenities.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {roomAmenities.map((a) => (
                <li key={a.icon} className="rounded-full border border-line bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
                  {withFallback(a.label, amenityT[a.id]?.label)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{t.roomDetail.noAmenities}</p>
          )}

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">{t.roomDetail.ratesTitle}</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {room.type.rates.map((r) => (
                <tr key={r.id} className="border-b border-line">
                  <td className="py-2.5">{r.label}</td>
                  <td className="py-2.5 text-right font-bold">{r.price ? fmtMoney(r.price) : callWord}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={`tel:${settings.phoneHref}`} className="btn-primary">
              {t.roomDetail.callNow}
            </a>
            <a
              href={waLink(settings.whatsapp, `Hello, I'd like information about Onay Apart room ${room.number} (${room.type.code}).`)}
              target="_blank"
              rel="noopener"
              className="btn-wa"
            >
              {t.roomDetail.messageForRoom}
            </a>
          </div>

          <div className="mt-8">
            <LeadForm roomNumber={room.number} phoneDisplay={settings.phoneDisplay} labels={t.lead} />
          </div>
        </div>
      </main>

      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
