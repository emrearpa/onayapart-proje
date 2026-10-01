import { prisma } from "@/shared/lib/db";
import { site } from "@/shared/lib/site";
import { parseIcs, buildIcs } from "@/features/calendar-sync/ical";
import { ACTIVE_RESERVATION_STATUSES } from "@/features/reservations/constants";

export type SyncResult = { ok: boolean; error?: string; count: number };

const FETCH_TIMEOUT_MS = 15_000;
const MAX_ICS_BYTES = 2 * 1024 * 1024;
const MAX_ERROR_LENGTH = 300;

/**
 * Sunucunun cekecegi takvim adresi yalnizca herkese acik bir https adresi olabilir;
 * boylece panelden girilen bir adresle ic aga (localhost, 10.x, 192.168.x ...) istek
 * yaptirilamaz (SSRF korumasi).
 */
export function isSafeCalendarUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") || host.includes(":")) return false;
  const ipv4 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    const isPrivate = a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
    if (isPrivate) return false;
  }
  return true;
}

async function fetchCalendar(url: string): Promise<string> {
  if (!isSafeCalendarUrl(url)) throw new Error("Takvim adresi geçersiz (https ile başlayan genel bir adres olmalı).");
  const res = await fetch(url, {
    headers: { "User-Agent": "OnayApartERP/1.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.length > MAX_ICS_BYTES) throw new Error("Takvim dosyası çok büyük.");
  if (!text.includes("BEGIN:VCALENDAR")) throw new Error("Adres geçerli bir takvim (.ics) döndürmedi.");
  return text;
}

/** Tek bir harici takvimi (Booking.com/Airbnb) getirip senkronize eder.
 *  Iptal edilen/kaldirilan etkinlikleri de temizler (fark bazli senkron). */
export async function syncExternalCalendar(calendarId: string): Promise<SyncResult> {
  const cal = await prisma.externalCalendar.findUnique({ where: { id: calendarId } });
  if (!cal) return { ok: false, error: "Takvim bulunamadı.", count: 0 };

  let text: string;
  try {
    text = await fetchCalendar(cal.importUrl);
  } catch (e) {
    const error = e instanceof Error ? e.message : "Bilinmeyen hata";
    await prisma.externalCalendar.update({
      where: { id: calendarId },
      data: { lastSyncAt: new Date(), lastSyncOk: false, lastSyncError: error.slice(0, MAX_ERROR_LENGTH) },
    });
    return { ok: false, error, count: 0 };
  }

  const events = parseIcs(text);
  const scope = { roomId: cal.roomId, platform: cal.platform };

  // Upsert + artik kaynakta olmayanlari silme tek islemde: yarida kalirsa oda yanlis musait/dolu gorunmez.
  await prisma.$transaction([
    ...events.map((ev) =>
      prisma.externalBooking.upsert({
        where: { roomId_platform_externalUid: { ...scope, externalUid: ev.uid } },
        update: { checkIn: ev.start, checkOut: ev.end, summary: ev.summary || null },
        create: { ...scope, externalUid: ev.uid, checkIn: ev.start, checkOut: ev.end, summary: ev.summary || null },
      })
    ),
    prisma.externalBooking.deleteMany({ where: { ...scope, externalUid: { notIn: events.map((ev) => ev.uid) } } }),
    prisma.externalCalendar.update({ where: { id: calendarId }, data: { lastSyncAt: new Date(), lastSyncOk: true, lastSyncError: null } }),
  ]);

  return { ok: true, count: events.length };
}

export async function syncAllExternalCalendars(): Promise<{ total: number; ok: number; failed: number }> {
  const calendars = await prisma.externalCalendar.findMany({ select: { id: true } });
  const results = await Promise.allSettled(calendars.map((c) => syncExternalCalendar(c.id)));
  const ok = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  return { total: calendars.length, ok, failed: calendars.length - ok };
}

/** Bir odanin kendi rezervasyonlarindan Booking.com/Airbnb'ye verilecek .ics disa aktarimi. */
export async function buildRoomExportIcs(roomId: string): Promise<string | null> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { reservations: { where: { status: { in: ACTIVE_RESERVATION_STATUSES } } } },
  });
  if (!room) return null;

  const host = new URL(site.url).hostname;
  const events = room.reservations.map((r) => ({
    uid: `onayapart-${r.id}@${host}`,
    start: r.checkIn,
    end: r.checkOut,
    summary: `Dolu (${site.shortName})`,
  }));

  return buildIcs(events, `${site.shortName} — Oda ${room.number}`);
}
