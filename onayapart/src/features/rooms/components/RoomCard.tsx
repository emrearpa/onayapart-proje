import Link from "next/link";
import type { Locale } from "@/shared/i18n/config";
import { site } from "@/shared/lib/site";
import { availabilityOf } from "@/features/rooms/availability";
import { roomLabels } from "@/features/rooms/labels";
import { roomPath } from "@/features/rooms/paths";
import RoomPhoto, { placeholder } from "@/features/rooms/components/RoomPhoto";
import StatusBadge from "@/features/rooms/components/StatusBadge";

type Props = {
  room: {
    number: number;
    floor: number;
    m2: number;
    condition: string;
    type: { code: string; slug: string; capacity: string };
    photos: { url: string; alt: string }[];
    reservations: { checkIn: Date; checkOut: Date; status: string }[];
    externalBookings: { checkIn: Date; checkOut: Date }[];
  };
  priority?: boolean;
  /** Ceviri sayfalarinda verilir: adres /<dil>/odalar/... olur ve etiketler o dilde cikar. */
  locale?: Locale;
};

export default function RoomCard({ room, priority, locale }: Props) {
  const labels = roomLabels(locale);
  const title = `${labels.room} ${room.number}`;
  const state = availabilityOf(room.condition, room.reservations, new Date(), room.externalBookings);
  const photo = room.photos[0];

  return (
    <Link
      href={`${locale ? `/${locale}` : ""}${roomPath(room)}`}
      className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-800">
        <RoomPhoto
          src={photo?.url ?? placeholder(title, room.type.code, room.number)}
          alt={photo?.alt ?? `${site.shortName} ${room.type.code} — ${title}`}
          priority={priority}
        />
      </div>
      <div className="p-4">
        <div className="font-extrabold tracking-tight">
          {title} · {room.type.code}
        </div>
        <div className="mt-0.5 text-[13px] text-ink-soft">
          {room.floor}
          {labels.floorSuffix} · {room.m2} m² · {room.type.capacity}
        </div>
        <div className="mt-2">
          <StatusBadge state={state} labels={labels.availability} />
        </div>
      </div>
    </Link>
  );
}
