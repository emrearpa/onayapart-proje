import { prisma } from "@/shared/lib/db";
import { parseIcs, buildIcs } from "@/features/calendar-sync/ical";
import { site } from "@/shared/lib/site";

export type SyncResult = { ok: boolean; error?: string; count: number };

/** Tek bir harici takvimi (Booking.com/Airbnb) getirip senkronize eder.
 *  Iptal edilen/kaldirilan etkinlikleri de temizler (fark bazli senkron). */
export async function syncExternalCalendar(calendarId: string): Promise<SyncResult> {
  const cal = await prisma.externalCalendar.findUnique({ where: { id: calendarId } });
  if (!cal) return { ok: false, error: "Takvim bulunamadı.", count: 0 };

  let text: string;
  try {
    const res = await fetch(cal.importUrl, { headers: { "User-Agent": "OnayApartERP/1.0" }, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
    await prisma.externalCalendar.update({
      where: { id: calendarId },
      data: { lastSyncAt: new Date(), lastSyncOk: false, lastSyncError: msg.slice(0, 300) },
    });
    return { ok: false, error: msg, count: 0 };
  }

  const events = parseIcs(text);

  const existing = await prisma.externalBooking.findMany({
    where: { roomId: cal.roomId, platform: cal.platform },
    select: { id: true, externalUid: true },
  });
  const existingByUid = new Map(existing.map((e) => [e.externalUid, e.id]));
  const seenUids = new Set<string>();

  for (const ev of events) {
    seenUids.add(ev.uid);
    await prisma.externalBooking.upsert({
      where: { roomId_platform_externalUid: { roomId: cal.roomId, platform: cal.platform, externalUid: ev.uid } },
      update: { checkIn: ev.start, checkOut: ev.end, summary: ev.summary || null },
      create: {
        roomId: cal.roomId,
        platform: cal.platform,
        externalUid: ev.uid,
        checkIn: ev.start,
        checkOut: ev.end,
        summary: ev.summary || null,
      },
    });
  }

  // Artik kaynak takvimde olmayan (iptal edilmis) kayitlari sil.
  const toDelete = existing.filter((e) => !seenUids.has(e.externalUid)).map((e) => e.id);
  if (toDelete.length > 0) {
    await prisma.externalBooking.deleteMany({ where: { id: { in: toDelete } } });
  }

  await prisma.externalCalendar.update({
    where: { id: calendarId },
    data: { lastSyncAt: new Date(), lastSyncOk: true, lastSyncError: null },
  });

  return { ok: true, count: events.length };
}

export async function syncAllExternalCalendars(): Promise<{ total: number; ok: number; failed: number }> {
  const calendars = await prisma.externalCalendar.findMany({ select: { id: true } });
  let ok = 0;
  let failed = 0;
  for (const c of calendars) {
    const result = await syncExternalCalendar(c.id);
    if (result.ok) ok++;
    else failed++;
  }
  return { total: calendars.length, ok, failed };
}

/** Bir odanin kendi rezervasyonlarindan Booking.com/Airbnb'ye verilecek .ics disa aktarimi. */
export async function buildRoomExportIcs(roomId: string): Promise<string | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { reservations: { where: { status: { in: ["OPSIYON", "ONAYLI", "GIRIS_YAPTI"] } } } },
  });
  if (!room) return null;

  const events = room.reservations.map((r) => ({
    uid: `onayapart-${r.id}@${new URL(site.url).hostname}`,
    start: r.checkIn,
    end: r.checkOut,
    summary: "Dolu (Onay Apart)",
  }));

  return buildIcs(events, `Onay Apart — Oda ${room.number}`);
}
