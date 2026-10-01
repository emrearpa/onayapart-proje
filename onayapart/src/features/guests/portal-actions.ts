"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { optStr, positiveNum, str, strList } from "@/shared/lib/form";
import { normalizePhone } from "@/shared/lib/phone";
import { site } from "@/shared/lib/site";
import { GUEST_LOGIN_PATH, requireGuest } from "@/features/auth/guards";
import { clearAttempts, clientIp, consumeAttempt } from "@/shared/lib/rate-limit";
import { SESSION_COOKIES, createSessionToken, sessionCookieOptions } from "@/features/auth/session";
import { getSiteSettings } from "@/features/content/queries";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { buildBuyerFromGuest, isIyzicoReady, startCheckoutForm } from "@/features/payments/iyzico";

// Misafirin kendi panelindeki (/musteri) islemler. Her action, kaydin gercekten
// oturumdaki misafire ait oldugunu dogrular.

const HOME_PATH = "/musteri";
const MAX_ORDER_QUANTITY = 20;

function fail(reason: string): never {
  redirect(`${HOME_PATH}?hata=${reason}`);
}

/** Giris: rezervasyonda kayitli telefon + kimlik numarasi. */
export async function guestLogin(formData: FormData) {
  const failure = `${GUEST_LOGIN_PATH}?hata=1`;
  if (!consumeAttempt("guest")) redirect(`${GUEST_LOGIN_PATH}?hata=cok-deneme`);

  const phone = normalizePhone(str(formData, "phone"));
  const idNumber = str(formData, "tcNo");
  if (!phone || !idNumber) redirect(failure);

  // Telefon farkli bicimlerde kayitli olabilir; kimlik no ile daraltip normalize ederek eslestiririz.
  const candidates = await prisma.guest.findMany({ where: { idNumber }, select: { id: true, phone: true } });
  const guest = candidates.find((g) => normalizePhone(g.phone) === phone);
  if (!guest) redirect(failure);

  clearAttempts("guest");
  cookies().set(SESSION_COOKIES.guest, await createSessionToken("guest", { guestId: guest.id }), sessionCookieOptions("guest"));
  redirect(HOME_PATH);
}

export async function guestLogout() {
  cookies().delete(SESSION_COOKIES.guest);
  redirect(GUEST_LOGIN_PATH);
}

/** Misafirin kendi panelinden actigi bakim/ariza talebi. */
export async function createGuestRequest(formData: FormData) {
  const guestId = await requireGuest();
  const roomId = str(formData, "roomId");
  const title = str(formData, "title");
  if (!roomId || !title) fail("eksik");

  // Secilen daire bu misafirin bir rezervasyonuna ait olmali; baskasinin dairesi adina talep acilamaz.
  const ownsRoom = await prisma.reservation.findFirst({ where: { guestId, roomId }, select: { id: true } });
  if (!ownsRoom) fail("yetkisiz");

  await prisma.task.create({ data: { roomId, guestId, kind: "ARIZA", title, message: optStr(formData, "message") } });
  revalidatePath("/panel", "layout");
  revalidatePath(HOME_PATH);
  redirect(`${HOME_PATH}?ok=talep`);
}

/** Misafirin kendi bakiyesini kredi kartiyla odemesini baslatir. Kart bilgileri bu
 *  sunucuya hic gelmez - misafir iyzico'nun kendi guvenli sayfasina yonlendirilir. */
export async function startOnlinePayment(formData: FormData) {
  const guestId = await requireGuest();
  const reservationId = str(formData, "reservationId");

  const settings = await getIntegrationSettings();
  if (!isIyzicoReady(settings)) fail("odeme-kapali");

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true, payments: { select: { amount: true } } },
  });
  if (!reservation || reservation.guestId !== guestId || reservation.status === "IPTAL") fail("yetkisiz");

  const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.round((reservation.totalAmount - paid) * 100) / 100;
  if (balance <= 0) fail("borc-yok");

  const { addressCity } = await getSiteSettings();
  const buyer = buildBuyerFromGuest(reservation.guest, { ip: clientIp(), city: addressCity });
  if (!buyer) fail("bilgi-eksik");

  const conversationId = `${reservation.id}-${Date.now()}`;
  const result = await startCheckoutForm(settings, {
    conversationId,
    amount: balance,
    callbackUrl: `${site.url}/api/odeme/geri-donus`,
    buyer,
    basketId: reservation.code,
    basketDescription: `${site.shortName} — ${reservation.code} nolu rezervasyon bakiyesi`,
  });
  if (!result.ok) fail("odeme-baslamadi");

  await prisma.onlinePaymentAttempt.create({ data: { reservationId, token: result.token, conversationId, amount: balance } });
  redirect(result.paymentPageUrl);
}

/**
 * Misafir kendi panelinden oda servisi siparisi verir. Siparis BEKLIYOR olarak
 * kaydedilir; personel onaylamadan rezervasyonun toplam tutarina islenmez.
 */
export async function createGuestRoomServiceOrder(formData: FormData) {
  const guestId = await requireGuest();
  const reservationId = str(formData, "reservationId");
  const itemIds = strList(formData, "items").filter(Boolean);
  if (itemIds.length === 0) fail("siparis-bos");

  const [reservation, settings] = await Promise.all([
    prisma.reservation.findUnique({ where: { id: reservationId }, select: { guestId: true, status: true } }),
    getSiteSettings(),
  ]);
  if (!reservation || reservation.guestId !== guestId || ["IPTAL", "TAMAMLANDI"].includes(reservation.status)) fail("yetkisiz");
  if (!settings.menuEnabled) fail("urun-yok");

  const items = await prisma.menuItem.findMany({ where: { id: { in: itemIds }, isAvailable: true } });
  if (items.length === 0) fail("urun-yok");

  const note = optStr(formData, "note");
  await prisma.roomServiceCharge.createMany({
    data: items.map((item) => {
      const quantity = Math.min(MAX_ORDER_QUANTITY, Math.max(1, Math.trunc(positiveNum(formData, `qty_${item.id}`)) || 1));
      return {
        reservationId,
        menuItemId: item.id,
        name: item.name,
        unitPrice: item.price,
        quantity,
        amount: item.price * quantity,
        note,
        status: "BEKLIYOR",
        source: "MISAFIR",
      };
    }),
  });

  revalidatePath(HOME_PATH);
  revalidatePath("/panel", "layout");
  redirect(`${HOME_PATH}?ok=siparis-verildi`);
}
