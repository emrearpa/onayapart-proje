import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import type { Availability } from "@/features/rooms/availability";

export type RoomLabels = {
  room: string;
  /** Kat numarasinin hemen ardina eklenir: "3" + ". kat" / "3" + " floor". */
  floorSuffix: string;
  units: string;
  available: string;
  viewRooms: string;
  callForPrice: string;
  availability: Record<Availability, string>;
};

/** Oda kartlarinda kullanilan kisa etiketler; dil verilmezse Turkce. */
export function roomLabels(locale?: Locale): RoomLabels {
  const t = getDictionary(locale);
  return {
    room: t.ui.room,
    floorSuffix: t.ui.floorSuffix,
    units: t.ui.units,
    available: t.ui.available,
    viewRooms: locale ? t.common.viewDetails : "Odaları gör",
    callForPrice: t.ui.callForPrice,
    availability: t.availability,
  };
}
