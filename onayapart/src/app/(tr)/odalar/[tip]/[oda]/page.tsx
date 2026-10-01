import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import Gallery from "@/features/rooms/components/Gallery";
import LeadForm from "@/features/leads/components/LeadForm";
import StatusBadge from "@/features/rooms/components/StatusBadge";
import JsonLd from "@/shared/components/JsonLd";
import { placeholder } from "@/features/rooms/components/RoomPhoto";
import { getRoom, getAmenities } from "@/features/rooms/queries";
import { availabilityOf, availabilityLabel } from "@/features/rooms/availability";
import { getSiteSettings } from "@/features/content/queries";
import { prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import { site, waLink } from "@/shared/lib/site";
import { hreflangAlternates } from "@/shared/i18n/config";

export const revalidate = 300;

type Props = { params: { tip: string; oda: string } };

const PHOTO_LABELS = ["Salon", "Yatak odası", "Mutfak", "Banyo"];

function numberFromSlug(slug: string) {
  const n = Number(slug.replace(/^oda-/, ""));
  return Number.isFinite(n) ? n : null;
}

export async function generateStaticParams() {
  const rooms = await prisma.room.findMany({
    where: { isPublished: true },
    select: { number: true, type: { select: { slug: true } } },
  });
  return rooms.map((r) => ({ tip: r.type.slug, oda: `oda-${r.number}` }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const n = numberFromSlug(params.oda);
  if (!n) return {};
  const room = await getRoom(n);
  if (!room) return {};

  return {
    title: `Oda ${room.number} — ${room.type.seoTitle}`,
    description: `Onay Apart Rezidans ${room.number} numaralı ${room.type.code} apart daire: ${room.m2} m², ${room.floor}. kat, ${room.type.capacity}. Erzurum Yakutiye merkezde günlük, aylık ve öğrenci konaklaması.`,
    alternates: {
      canonical: `/odalar/${room.type.slug}/oda-${room.number}`,
      languages: hreflangAlternates(`/odalar/${room.type.slug}/oda-${room.number}`),
    },
  };
}

export default async function RoomPage({ params }: Props) {
  const n = numberFromSlug(params.oda);
  if (!n) notFound();

  const room = await getRoom(n);
  if (!room || !room.isPublished || room.type.slug !== params.tip) notFound();

  const [settings, amenities] = await Promise.all([getSiteSettings(), getAmenities()]);

  const state = availabilityOf(room.condition, room.reservations, new Date(), room.externalBookings);
  const photos =
    room.photos.length > 0
      ? room.photos.map((p) => ({ url: p.url, alt: p.alt }))
      : PHOTO_LABELS.map((label, i) => ({
          url: placeholder(room.number, label, i),
          alt: `Erzurum ${room.type.code} apart daire ${room.number} — ${label.toLowerCase()}`,
        }));

  const specs = [
    ["Oda numarası", String(room.number)],
    ["Kat", `${room.floor}. kat`],
    ["Büyüklük", `${room.m2} m²`],
    ["Kapasite", room.type.capacity],
    ["Yatak düzeni", room.beds],
    ["Cephe", room.view],
  ];

  // Bu daire icin secim yapilmamissa (eski/varsayilan daireler) tum standart olanaklar gosterilir.
  const selectedKeys = room.amenities ? room.amenities.split(",") : amenities.map((a) => a.icon);
  const roomAmenities = amenities.filter((a) => selectedKeys.includes(a.icon));

  return (
    <>
      <Header />
      <main className="container-page grid gap-10 py-10 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <nav className="mb-4 text-xs text-ink-soft">
            <Link href="/odalar" className="hover:text-brand-500">Odalarımız</Link> /{" "}
            <Link href={`/odalar/${room.type.slug}`} className="hover:text-brand-500">{room.type.name}</Link> / Oda{" "}
            {room.number}
          </nav>
          <Gallery photos={photos} />
        </div>

        <div>
          <StatusBadge state={state} />
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
            Oda {room.number} — {room.type.name}
          </h1>
          <p className="lede mt-2">
            {room.type.tagline}. {room.view}.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-2.5">
            {specs.map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-brand-50/50 px-3.5 py-2.5">
                <dt className="text-[11px] text-ink-soft">{k}</dt>
                <dd className="text-sm font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">Dairede neler var?</h2>
          {roomAmenities.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {roomAmenities.map((a) => (
                <li key={a.icon} className="rounded-full border border-line bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600">
                  {a.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Bu daire için olanak bilgisi henüz girilmedi.</p>
          )}

          <h2 className="mt-8 text-lg font-extrabold tracking-tight">Konaklama fiyatları</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {room.type.rates.map((r) => (
                <tr key={r.id} className="border-b border-line">
                  <td className="py-2.5">{r.label}</td>
                  <td className="py-2.5 text-right font-bold">{r.price ? fmtMoney(r.price) : "Arayın"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a href={`tel:${settings.phoneHref}`} className="btn-primary">Hemen arayın</a>
            <a
              href={waLink(settings.whatsapp, `Merhaba, Onay Apart ${room.number} numaralı ${room.type.code} daire için bilgi almak istiyorum.`)}
              target="_blank"
              rel="noopener"
              className="btn-wa"
            >
              Bu oda için yazın
            </a>
          </div>

          <div className="mt-8">
            <LeadForm roomNumber={room.number} phoneDisplay={settings.phoneDisplay} />
          </div>
        </div>
      </main>

      <Footer />
      <FloatingCta />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Accommodation",
          name: `Onay Apart Oda ${room.number} — ${room.type.name}`,
          description: room.type.seoText,
          url: `${site.url}/odalar/${room.type.slug}/oda-${room.number}`,
          floorSize: { "@type": "QuantitativeValue", value: room.m2, unitCode: "MTK" },
          occupancy: { "@type": "QuantitativeValue", name: room.type.capacity },
          numberOfRooms: room.type.code === "2+1" ? 3 : room.type.code === "1+1" ? 2 : 1,
          availability: state === "MUSAIT" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          containedInPlace: { "@type": "ApartmentComplex", name: site.name },
          additionalProperty: { "@type": "PropertyValue", name: "Durum", value: availabilityLabel[state] },
        }}
      />
    </>
  );
}
