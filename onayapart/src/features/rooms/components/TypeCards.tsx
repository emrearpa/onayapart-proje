import Link from "next/link";
import Image from "next/image";
import { availabilityOf } from "@/features/rooms/availability";
import { fmtMoney } from "@/shared/lib/dates";
import { withFallback } from "@/features/content/translations";

type TypeWithRooms = {
  id?: string;
  slug: string;
  code: string;
  name: string;
  tagline: string;
  minM2: number;
  maxM2: number;
  capacity: string;
  features: string;
  imageUrl?: string | null;
  rates: { stayType: string; label: string; price: number }[];
  rooms: {
    condition: string;
    reservations: { checkIn: Date; checkOut: Date; status: string }[];
    externalBookings: { checkIn: Date; checkOut: Date }[];
  }[];
};

export default function TypeCards({
  types,
  hrefPrefix = "",
  translations,
  labels,
}: {
  types: TypeWithRooms[];
  hrefPrefix?: string;
  /** RoomType.id -> {name, tagline, features, capacity} ceviri degerleri (getBatchTranslations'tan). */
  translations?: Record<string, Record<string, string>>;
  labels?: { units: string; available: string; viewRooms: string; callForPrice: string };
}) {
  const L = labels ?? { units: "daire", available: "müsait", viewRooms: "Odaları gör", callForPrice: "Fiyat için arayın" };

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {types.map((t) => {
        const free = t.rooms.filter((r) => availabilityOf(r.condition, r.reservations, new Date(), r.externalBookings) === "MUSAIT").length;
        const daily = t.rates.find((r) => r.stayType === "GUNLUK");
        const tr = t.id ? translations?.[t.id] : undefined;
        const name = withFallback(t.name, tr?.name);
        const tagline = withFallback(t.tagline, tr?.tagline);
        const features = withFallback(t.features, tr?.features);
        const capacity = withFallback(t.capacity, tr?.capacity);

        return (
          <Link
            key={t.slug}
            href={`${hrefPrefix}/odalar/${t.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
          >
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-800 to-brand-500">
              {t.imageUrl ? (
                <Image src={t.imageUrl} alt={t.name} fill className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <span className="text-4xl font-extrabold tracking-tighter text-white">{t.code}</span>
                </div>
              )}
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-800">
                {t.rooms.length} {L.units} · {free} {L.available}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-extrabold tracking-tight">{name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{tagline}</p>

              <ul className="my-4 space-y-1.5 text-sm text-ink-soft">
                {features.split("\n").slice(0, 4).map((f) => (
                  <li key={f} className="relative pl-6">
                    <span className="absolute left-0 font-extrabold text-brand-500">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between border-t border-dashed border-line pt-4">
                <div>
                  <div className="text-lg font-extrabold">
                    {daily?.price ? fmtMoney(daily.price) : L.callForPrice}
                  </div>
                  <div className="text-xs text-ink-soft">
                    {t.minM2}–{t.maxM2} m² · {capacity}
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-500">{L.viewRooms}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
