import { prisma } from "@/shared/lib/db";
import { addMonths, dayDiff, startOfDay } from "@/shared/lib/dates";
import { normalizePhone } from "@/shared/lib/phone";
import { RECURRING_STAY_TYPES } from "@/features/reservations/constants";

export type UpcomingPayment = {
  guest: { id: string; fullName: string; phone: string };
  room: { number: number };
  reservation: { id: string; code: string; stayType: string };
  dueDate: Date;
  amount: number;
};

/** "2026-09" gibi donem anahtari; ayni hatirlatmanin ayni ay iki kez gitmesini engeller. */
export function currentPeriodKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Ayin `day`. gunu; ay o kadar uzun degilse ayin son gunu (orn. 31 -> Subat'ta 28/29). */
function dueDateInMonth(reference: Date, day: number): Date {
  const lastDay = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  return new Date(reference.getFullYear(), reference.getMonth(), Math.min(day, lastDay));
}

/**
 * Aylik/donemlik/kurumsal konaklamalarda, giris gunune denk gelen aylik odeme
 * tarihi yaklasan ya da gecmis olup hala bakiyesi olan musterileri bulur.
 * Yillik konaklamalarda toplam bedel 12'ye bolunur; giris gunune denk gelen
 * her ay icin bir taksit "vadesi gelmis" sayilir ve birikmis eksik odeme uyarilir.
 */
export async function getUpcomingPayments(daysAhead = 5): Promise<UpcomingPayment[]> {
  const today = startOfDay(new Date());

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["ONAYLI", "GIRIS_YAPTI"] },
      stayType: { in: RECURRING_STAY_TYPES },
      checkIn: { lte: today },
    },
    include: { guest: true, room: true, payments: { select: { amount: true } } },
  });

  const results: UpcomingPayment[] = [];
  for (const r of reservations) {
    const paid = r.payments.reduce((s, p) => s + p.amount, 0);
    let dueDate: Date;
    let amount: number;

    if (r.stayType === "YILLIK") {
      // Giris gunune denk gelen kac taksitin vadesi bugune kadar geldi?
      let installments = 0;
      while (installments < 12 && addMonths(r.checkIn, installments) <= today) installments++;
      if (installments === 0) continue;

      dueDate = addMonths(r.checkIn, installments - 1);
      amount = Math.min(r.totalAmount, (r.totalAmount / 12) * installments) - paid;
    } else {
      dueDate = dueDateInMonth(today, r.checkIn.getDate());
      amount = r.totalAmount - paid;
      if (dayDiff(today, dueDate) > daysAhead) continue;
    }

    if (amount <= 0) continue;
    results.push({
      guest: { id: r.guest.id, fullName: r.guest.fullName, phone: r.guest.phone },
      room: { number: r.room.number },
      reservation: { id: r.id, code: r.code, stayType: r.stayType },
      dueDate,
      amount,
    });
  }

  return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/** Bu donem icin odeme hatirlatmasi zaten gonderilmis rezervasyonlar. */
export async function getRemindedReservationIds(periodKey: string): Promise<Set<string | null>> {
  const sent = await prisma.messageLog.findMany({
    where: { kind: "ODEME_HATIRLATMA", periodKey, status: { in: ["GONDERILDI", "LINK_HAZIRLANDI"] } },
    select: { reservationId: true },
  });
  return new Set(sent.map((m) => m.reservationId));
}

/** Bugun odeme gunu gelmis (veya gecmis) ve hala borcu olan musteriler; hatirlatma ekrani icin. */
export async function getRemindableCustomers() {
  const periodKey = currentPeriodKey();
  const [due, remindedIds] = await Promise.all([getUpcomingPayments(0), getRemindedReservationIds(periodKey)]);
  return { periodKey, items: due.map((u) => ({ ...u, alreadyNotified: remindedIds.has(u.reservation.id) })) };
}

/**
 * Telefon numarasi hangi bicimde yazilirsa yazilsin (bosluklu, +90'li, 0'li) ayni
 * misafiri bulur. Eski kayitlar farkli bicimlerde durabildigi icin eslestirme
 * veritabaninda degil, normalize edilmis halleri karsilastirarak yapilir.
 */
export async function findGuestIdByPhone(rawPhone: string): Promise<string | null> {
  const target = normalizePhone(rawPhone);
  if (!target) return null;
  const guests = await prisma.guest.findMany({ select: { id: true, phone: true } });
  return guests.find((g) => normalizePhone(g.phone) === target)?.id ?? null;
}
