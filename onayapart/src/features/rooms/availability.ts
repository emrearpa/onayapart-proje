import { addDays, overlaps, startOfDay } from "@/shared/lib/dates";
import { ACTIVE_RESERVATION_STATUSES } from "@/features/reservations/constants";

export type Availability = "MUSAIT" | "DOLU" | "HARICI" | "TEMIZLIK" | "BAKIM";

type Stay = { checkIn: Date; checkOut: Date };

function coversDay(stay: Stay, day: Date): boolean {
  return overlaps(stay.checkIn, stay.checkOut, day, addDays(day, 1));
}

/** Bir dairenin o gunku durumu: rezervasyon > harici (Booking/Airbnb) > bakim/temizlik > musait */
export function availabilityOf(
  condition: string,
  reservations: (Stay & { status: string })[],
  day = new Date(),
  externalBookings: Stay[] = []
): Availability {
  const today = startOfDay(day);
  const isActive = (status: string) => (ACTIVE_RESERVATION_STATUSES as string[]).includes(status);

  if (reservations.some((r) => isActive(r.status) && coversDay(r, today))) return "DOLU";
  if (externalBookings.some((e) => coversDay(e, today))) return "HARICI";
  if (condition === "BAKIM") return "BAKIM";
  if (condition === "TEMIZLIK") return "TEMIZLIK";
  return "MUSAIT";
}

/** "1+1" -> 2, "2+1" -> 3. Kod bu bicimde degilse 1 doner (schema.org numberOfRooms icin). */
export function roomCountFromTypeCode(code: string): number {
  const parts = code.split("+").map((p) => Number(p.trim()));
  if (parts.length === 0 || parts.some((n) => !Number.isFinite(n))) return 1;
  return Math.max(1, parts.reduce((sum, n) => sum + n, 0));
}
