"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { isSafeCalendarUrl, syncAllExternalCalendars, syncExternalCalendar } from "@/features/calendar-sync/sync";

// Booking.com / Airbnb takvim senkronizasyonu (iCal).

const PLATFORMS = ["BOOKING", "AIRBNB", "DIGER"];
const roomPath = (formData: FormData) => `/panel/odalar/${str(formData, "roomNumber")}`;
const revalidateSite = () => revalidatePath("/", "layout");

export async function createExternalCalendar(formData: FormData) {
  await requirePanel("odalar");
  const back = roomPath(formData);
  const importUrl = str(formData, "importUrl");
  const platform = str(formData, "platform");
  if (!isSafeCalendarUrl(importUrl)) redirect(`${back}?hata=takvim-eksik`);

  const calendar = await prisma.externalCalendar.create({
    data: { roomId: str(formData, "roomId"), platform: PLATFORMS.includes(platform) ? platform : "DIGER", importUrl },
  });

  // Ekler eklemez ilk senkronu hemen dene, kullanici beklemeden veri gorsun.
  await syncExternalCalendar(calendar.id);
  revalidateSite();
  redirect(`${back}?ok=takvim`);
}

export async function deleteExternalCalendar(formData: FormData) {
  await requirePanel("odalar");
  // Takvim kaldirilinca ondan gelen "dolu" tarihler de kalkar; yoksa oda sonsuza dek dolu gorunurdu.
  const calendar = await prisma.externalCalendar.delete({ where: { id: str(formData, "id") } });
  const remaining = await prisma.externalCalendar.count({ where: { roomId: calendar.roomId, platform: calendar.platform } });
  if (remaining === 0) {
    await prisma.externalBooking.deleteMany({ where: { roomId: calendar.roomId, platform: calendar.platform } });
  }
  revalidateSite();
  redirect(`${roomPath(formData)}?ok=takvim`);
}

export async function syncExternalCalendarNow(formData: FormData) {
  await requirePanel("odalar");
  const result = await syncExternalCalendar(str(formData, "id"));
  revalidateSite();
  redirect(`${roomPath(formData)}?${result.ok ? "ok" : "hata"}=takvim-senkron`);
}

/** Tum odalardaki tum harici takvimleri tek seferde senkronize eder. */
export async function syncAllCalendars() {
  await requirePanel("odalar");
  const result = await syncAllExternalCalendars();
  revalidateSite();
  redirect(`/panel/odalar?ok=takvim-toplu&basarili=${result.ok}&toplam=${result.total}`);
}
