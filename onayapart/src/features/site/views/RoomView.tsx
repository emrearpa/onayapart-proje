import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/shared/components/JsonLd";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site, waLink } from "@/shared/lib/site";
import { fillPlaceholders } from "@/shared/lib/text";
import { localize, localizeOne } from "@/features/content/localized";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import LeadForm from "@/features/leads/components/LeadForm";
import { availabilityOf, roomCountFromTypeCode } from "@/features/rooms/availability";
import Gallery from "@/features/rooms/components/Gallery";
import RateTable from "@/features/rooms/components/RateTable";
import { placeholder } from "@/features/rooms/components/RoomPhoto";
import StatusBadge from "@/features/rooms/components/StatusBadge";
import { roomNumberFromSlug, roomPath } from "@/features/rooms/paths";
import { getAmenities, getRoom } from "@/features/rooms/queries";
import SiteShell from "@/features/site/components/SiteShell";

const PLACEHOLDER_PHOTO_COUNT = 4;

/** Adresteki tip ve oda parcalariyla eslesen, yayindaki daire; cevirileri uygulanmis halde. */
async function getLocalizedRoom(typeSlug: string, roomSlug: string, locale?: Locale) {
  const number = roomNumberFromSlug(roomSlug);
  const room = number ? await getRoom(number) : null;
  if (!room || !room.isPublished || room.type.slug !== typeSlug) return null;

  const [localizedRoom, type] = await Promise.all([
    localizeOne("Room", room, ["beds", "view"], locale),
    localizeOne("RoomType", room.type, ["name", "tagline", "capacity"], locale),
  ]);
  return { ...localizedRoom, type };
}

export async function roomMetadata(typeSlug: string, roomSlug: string, locale?: Locale): Promise<Metadata> {
  const room = await getLocalizedRoom(typeSlug, roomSlug, locale);
  if (!room) return {};
  const t = getDictionary(locale);
  return {
    title: `${t.ui.room} ${room.number} — ${room.type.name}`,
    description: `${site.name} · ${t.ui.room} ${room.number} · ${room.type.name} · ${room.m2} m² · ${room.floor}${t.ui.floorSuffix} · ${room.type.capacity}`,
    alternates: await pageAlternates(roomPath(room), locale),
  };
}

export default async function RoomView({ typeSlug, roomSlug, locale }: { typeSlug: string; roomSlug: string; locale?: Locale }) {
  const t = getDictionary(locale);
  const prefix = locale ? `/${locale}` : "";

  const room = await getLocalizedRoom(typeSlug, roomSlug, locale);
  if (!room) notFound();

  const [settings, allAmenities] = await Promise.all([getSiteSettings(), getAmenities()]);
  // Bu daire icin secim yapilmamissa tum standart olanaklar gosterilir.
  const selectedIcons = room.amenities ? room.amenities.split(",") : null;
  const amenities = await localize("Amenity", selectedIcons ? allAmenities.filter((a) => selectedIcons.includes(a.icon)) : allAmenities, ["label"], locale);

  const title = `${t.ui.room} ${room.number}`;
  const state = availabilityOf(room.condition, room.reservations, new Date(), room.externalBookings);
  const photos =
    room.photos.length > 0
      ? room.photos.map((p) => ({ url: p.url, alt: p.alt }))
      : Array.from({ length: PLACEHOLDER_PHOTO_COUNT }, (_, i) => ({
          url: placeholder(title, room.type.name, i),
          alt: `${site.shortName} ${room.type.code} — ${title}`,
        }));

  const specs = [
    [t.roomDetail.roomNumber, String(room.number)],
    [t.roomDetail.floor, `${room.floor}${t.ui.floorSuffix}`],
    [t.roomDetail.size, `${room.m2} m²`],
    [t.roomDetail.capacity, room.type.capacity],
    [t.roomDetail.bedLayout, room.beds],
    [t.roomDetail.view, room.view],
  ].filter(([, value]) => value);

  return (
    <SiteShell locale={locale}>
      <main className="container-page grid gap-10 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <nav aria-label="breadcrumb" className="mb-4 text-xs text-ink-soft">
            <Link href={`${prefix}/odalar`} className="hover:text-brand-500">
              {t.rooms.title}
            </Link>{" "}
            /{" "}
            <Link href={`${prefix}/odalar/${room.type.slug}`} className="hover:text-brand-500">
              {room.type.name}
            </Link>{" "}
            / {title}
          </nav>
          <Gallery photos={photos} />
        </div>

        <div>
          <StatusBadge state={state} labels={t.availability} />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            {title} — {room.type.name}
          </h1>
          <p className="lede mt-2">{[room.type.tagline, room.view].filter(Boolean).join(" · ")}</p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5">
            {specs.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-brand-50/50 px-3.5 py-2.5">
                <dt className="text-[11px] text-ink-soft">{label}</dt>
                <dd className="text-sm font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">{t.roomDetail.amenitiesTitle}</h2>
          {amenities.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <li key={amenity.id} className="rounded-full border border-line bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
                  {amenity.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{t.roomDetail.noAmenities}</p>
          )}

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">{t.roomDetail.ratesTitle}</h2>
          <div className="mt-3">
            <RateTable rates={room.type.rates} locale={locale} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={`tel:${settings.phoneHref}`} className="btn-primary">
              {t.roomDetail.callNow}
            </a>
            <a
              href={waLink(settings.whatsapp, fillPlaceholders(t.ui.roomInquiry, { room: String(room.number), type: room.type.code }))}
              target="_blank"
              rel="noopener noreferrer"
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

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Accommodation",
          name: `${site.shortName} ${title} — ${room.type.name}`,
          description: room.type.tagline,
          url: `${site.url}${prefix}${roomPath(room)}`,
          floorSize: { "@type": "QuantitativeValue", value: room.m2, unitCode: "MTK" },
          occupancy: { "@type": "QuantitativeValue", name: room.type.capacity },
          numberOfRooms: roomCountFromTypeCode(room.type.code),
          containedInPlace: { "@type": "ApartmentComplex", name: site.name },
          additionalProperty: { "@type": "PropertyValue", name: t.roomDetail.roomNumber, value: String(room.number) },
        }}
      />
    </SiteShell>
  );
}
