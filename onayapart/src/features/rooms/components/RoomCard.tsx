import Link from "next/link";
import RoomPhoto, { placeholder } from "@/features/rooms/components/RoomPhoto";
import StatusBadge from "@/features/rooms/components/StatusBadge";
import { availabilityOf } from "@/features/rooms/availability";

type Props = {
  room: {
    number: number;
    floor: number;
    m2: number;
    condition: string;
    type: { code: string; slug: string; name: string; capacity: string };
    photos: { url: string; alt: string }[];
    reservations: { checkIn: Date; checkOut: Date; status: string }[];
    externalBookings: { checkIn: Date; checkOut: Date }[];
  };
  priority?: boolean;
  /** Ceviri site rotalari icin: /en/odalar/... gibi bir on ek ve "Room"/"floor" etiketleri. */
  hrefPrefix?: string;
  labels?: { room: string; floor: string };
};

export default function RoomCard({ room, priority, hrefPrefix = "", labels }: Props) {
  const state = availabilityOf(room.condition, room.reservations, new Date(), room.externalBookings);
  const photo = room.photos[0];
  const src = photo?.url ?? placeholder(room.number, "Salon", room.number);
  const alt =
    photo?.alt ?? `Erzurum ${room.type.code} apart daire — ${room.number} numaralı odanın salonu`;
  const roomLabel = labels?.room ?? "Oda";
  const floorLabel = labels?.floor ?? ". kat";

  return (
    <Link
      href={`${hrefPrefix}/odalar/${room.type.slug}/oda-${room.number}`}
      className="group overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-800">
        <RoomPhoto src={src} alt={alt} priority={priority} className="h-full w-full object-cover" />
      </div>
      <div className="p-4">
        <div className="font-extrabold tracking-tight">
          {roomLabel} {room.number} · {room.type.code}
        </div>
        <div className="mt-0.5 text-[13px] text-ink-soft">
          {room.floor}{floorLabel} · {room.m2} m² · {room.type.capacity}
        </div>
        <div className="mt-2">
          <StatusBadge state={state} />
        </div>
      </div>
    </Link>
  );
}
