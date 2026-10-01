import { prisma } from "@/shared/lib/db";
import { addDays, overlaps, startOfDay } from "@/shared/lib/dates";
import { ACTIVE_RESERVATION_STATUSES } from "@/features/reservations/constants";

type Stay = { roomId: string; checkIn: Date; checkOut: Date };

function coversDay(stay: Stay, day: Date) {
  return overlaps(stay.checkIn, stay.checkOut, day, addDays(day, 1));
}

/** ERP gosterge paneli ozeti */
export async function getDashboard(days = 14) {
  const today = startOfDay(new Date());
  const until = addDays(today, days);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const active = { in: ACTIVE_RESERVATION_STATUSES };

  const [rooms, reservations, externalBookings, leads, openTasks, monthRevenue, activeReservations] = await Promise.all([
    prisma.room.findMany({ orderBy: { number: "asc" }, include: { type: true } }),
    prisma.reservation.findMany({
      where: { status: active, checkOut: { gte: today }, checkIn: { lt: until } },
      include: { guest: true, room: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.externalBooking.findMany({ where: { checkOut: { gte: today }, checkIn: { lt: until } } }),
    prisma.lead.findMany({ where: { handled: false }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.task.findMany({ where: { status: "ACIK" }, include: { room: true, guest: true }, orderBy: { createdAt: "asc" } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.reservation.findMany({
      where: { status: active },
      select: { totalAmount: true, kbsReported: true, checkIn: true, payments: { select: { amount: true } } },
    }),
  ]);

  const occupiedToday = rooms.filter((room) =>
    [...reservations, ...externalBookings].some((stay) => stay.roomId === room.id && coversDay(stay, today))
  ).length;
  const isToday = (d: Date) => startOfDay(d).getTime() === today.getTime();

  const receivable = activeReservations.reduce(
    (s, r) => s + Math.max(0, r.totalAmount - r.payments.reduce((a, p) => a + p.amount, 0)),
    0
  );

  return {
    today,
    days,
    rooms,
    reservations,
    externalBookings,
    leads,
    openTasks,
    kpi: {
      occupancy: rooms.length ? Math.round((occupiedToday / rooms.length) * 100) : 0,
      occupiedToday,
      totalRooms: rooms.length,
      arrivals: reservations.filter((r) => isToday(r.checkIn)).length,
      departures: reservations.filter((r) => isToday(r.checkOut)).length,
      monthRevenue: monthRevenue._sum.amount ?? 0,
      receivable,
      pendingKbs: activeReservations.filter((r) => !r.kbsReported && startOfDay(r.checkIn) <= today).length,
    },
  };
}

export type CalendarCellState = "DOLU" | "HARICI" | "BAKIM" | "TEMIZLIK" | "BOS";

/** Takvim seridi: her oda icin gun gun durum */
export function buildCalendar(
  rooms: { id: string; number: number; condition: string; type: { code: string } }[],
  reservations: (Stay & { id: string; guest: { fullName: string } })[],
  start: Date,
  days: number,
  externalBookings: (Stay & { platform: string })[] = []
) {
  return rooms.map((room) => ({
    room,
    cells: Array.from({ length: days }, (_, i) => {
      const day = addDays(start, i);
      const reservation = reservations.find((r) => r.roomId === room.id && coversDay(r, day));
      const external = reservation ? undefined : externalBookings.find((e) => e.roomId === room.id && coversDay(e, day));
      const stay = reservation ?? external;

      let state: CalendarCellState = "BOS";
      if (reservation) state = "DOLU";
      else if (external) state = "HARICI";
      else if (room.condition === "BAKIM") state = "BAKIM";
      else if (room.condition === "TEMIZLIK") state = "TEMIZLIK";

      return {
        date: day,
        state,
        guest: reservation?.guest.fullName ?? external?.platform ?? null,
        reservationId: reservation?.id ?? null,
        isStart: stay ? startOfDay(stay.checkIn).getTime() === day.getTime() : false,
      };
    }),
  }));
}
