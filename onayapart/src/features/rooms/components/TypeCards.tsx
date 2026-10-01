import Link from "next/link";
import SmartImage from "@/shared/components/SmartImage";
import type { Locale } from "@/shared/i18n/config";
import { fmtMoney } from "@/shared/lib/dates";
import { getBatchTranslations, withFallback } from "@/features/content/translations";
import { availabilityOf } from "@/features/rooms/availability";
import { roomLabels } from "@/features/rooms/labels";

type TypeWithRooms = {
  id: string;
  slug: string;
  code: string;
  name: string;
  tagline: string;
  minM2: number;
  maxM2: number;
  capacity: string;
  features: string;
  imageUrl: string | null;
  rates: { stayType: string; price: number }[];
  rooms: {
    condition: string;
    reservations: { checkIn: Date; checkOut: Date; status: string }[];
    externalBookings: { checkIn: Date; checkOut: Date }[];
  }[];
};

const MAX_FEATURES = 4;

/** Oda tipi tanitim kartlari. `locale` verilirse metinler o dildeki cevirileriyle gosterilir. */
export default async function TypeCards({ types, locale }: { types: TypeWithRooms[]; locale?: Locale }) {
  const labels = roomLabels(locale);
  const translations = locale ? await getBatchTranslations("RoomType", types.map((t) => t.id), locale) : {};
  const now = new Date();

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {types.map((type) => {
        const tr = translations[type.id];
        const name = withFallback(type.name, tr?.name);
        const features = withFallback(type.features, tr?.features).split("\n").filter(Boolean);
        const freeCount = type.rooms.filter((r) => availabilityOf(r.condition, r.reservations, now, r.externalBookings) === "MUSAIT").length;
        const dailyPrice = type.rates.find((r) => r.stayType === "GUNLUK")?.price;

        return (
          <Link
            key={type.id}
            href={`${locale ? `/${locale}` : ""}/odalar/${type.slug}`}
            className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
          >
            <div className="relative h-36 overflow-hidden bg-gradient-to-br from-brand-800 to-brand-500">
              {type.imageUrl ? (
                <SmartImage src={type.imageUrl} alt={name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <span className="text-4xl font-extrabold tracking-tighter text-white">{type.code}</span>
                </div>
              )}
              <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-brand-800">
                {type.rooms.length} {labels.units} · {freeCount} {labels.available}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg font-extrabold tracking-tight">{name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{withFallback(type.tagline, tr?.tagline)}</p>

              <ul className="my-4 space-y-1.5 text-sm text-ink-soft">
                {features.slice(0, MAX_FEATURES).map((feature) => (
                  <li key={feature} className="relative pl-6">
                    <span className="absolute left-0 font-extrabold text-brand-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center justify-between border-t border-dashed border-line pt-4">
                <div>
                  <div className="text-lg font-extrabold">{dailyPrice ? fmtMoney(dailyPrice) : labels.callForPrice}</div>
                  <div className="text-xs text-ink-soft">
                    {type.minM2}–{type.maxM2} m² · {withFallback(type.capacity, tr?.capacity)}
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-500">{labels.viewRooms}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
