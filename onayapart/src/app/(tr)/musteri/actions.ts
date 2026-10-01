"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function guestLogin(formData: FormData) {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const tcNo = String(formData.get("tcNo") ?? "").trim();

  if (!phoneRaw || !tcNo) redirect("/musteri/giris?hata=1");

  const { normalizePhone } = await import("@/lib/whatsapp");
  const normalizedInput = normalizePhone(phoneRaw);

  // Telefon farkli formatlarda kayitli olabilir (bosluklu, +90'li, 0'li vb.) -
  // T.C. kimlik no ile once daraltip, telefonu normalize ederek eslestiriyoruz.
  const candidates = await prisma.guest.findMany({ where: { idNumber: tcNo } });
  const guest = candidates.find((g) => normalizePhone(g.phone) === normalizedInput);

  if (!guest) {
    redirect("/musteri/giris?hata=1");
  }

  cookies().set("oa_guest", guest.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/musteri");
}

export async function guestLogout() {
  cookies().delete("oa_guest");
  redirect("/musteri/giris");
}

/** Misafirin kendi panelinden actigi bakim/ariza talebi. */
export async function createGuestRequest(formData: FormData) {
  const guestId = cookies().get("oa_guest")?.value;
  if (!guestId) redirect("/musteri/giris");

  const roomId = String(formData.get("roomId"));
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!roomId || !title) redirect("/musteri?hata=eksik");

  // Guvenlik: secilen daire gercekten bu musterinin bir rezervasyonuna ait olmali,
  // boylece bir misafir baskasinin dairesi adina talep acamaz.
  const belongs = await prisma.reservation.findFirst({ where: { guestId, roomId } });
  if (!belongs) redirect("/musteri?hata=yetkisiz");

  await prisma.task.create({
    data: { roomId, guestId, kind: "ARIZA", title, message: message || null },
  });

  revalidatePath("/panel");
  revalidatePath("/musteri");
  redirect("/musteri?ok=talep");
}

/** Misafirin kendi bakiyesini kredi kartiyla odemesini baslatir. Kart bilgileri
 *  bu sunucuya hic gelmez - misafir iyzico'nun kendi guvenli sayfasina yonlendirilir. */
export async function startOnlinePayment(formData: FormData) {
  const guestId = cookies().get("oa_guest")?.value;
  if (!guestId) redirect("/musteri/giris");

  const reservationId = String(formData.get("reservationId"));

  const { getIntegrationSettings, startCheckoutForm, buildBuyerFromGuest } = await import("@/lib/iyzico");
  const settings = await getIntegrationSettings();

  if (!settings.iyzicoEnabled || !settings.iyzicoApiKey || !settings.iyzicoSecretKey) {
    redirect("/musteri?hata=odeme-kapali");
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true, room: true, payments: true },
  });
  if (!reservation || reservation.guestId !== guestId) redirect("/musteri?hata=yetkisiz");

  const paid = reservation.payments.reduce((s, p) => s + p.amount, 0);
  const balance = Math.round((reservation.totalAmount - paid) * 100) / 100;
  if (balance <= 0) redirect("/musteri?hata=borc-yok");

  const buyer = buildBuyerFromGuest(reservation.guest);
  if (!buyer) redirect("/musteri?hata=bilgi-eksik");

  const { site } = await import("@/lib/site");
  const conversationId = `${reservation.id}-${Date.now()}`;

  const result = await startCheckoutForm(
    { iyzicoApiKey: settings.iyzicoApiKey, iyzicoSecretKey: settings.iyzicoSecretKey, iyzicoSandbox: settings.iyzicoSandbox },
    {
      conversationId,
      amount: balance,
      callbackUrl: `${site.url}/api/odeme/geri-donus`,
      buyer,
      basketId: reservation.code,
      basketDescription: `Onay Apart — ${reservation.code} nolu rezervasyon bakiyesi`,
    }
  );

  if (!result.ok) redirect(`/musteri?hata=odeme-baslamadi`);

  await prisma.onlinePaymentAttempt.create({
    data: { reservationId, token: result.token, conversationId, amount: balance },
  });

  redirect(result.paymentPageUrl);
}

/**
 * Misafir kendi panelinden oda servisi siparisi verir. Sadece BEKLIYOR olarak kaydedilir -
 * personel onaylamadan rezervasyonun toplam tutarina islenmez.
 */
export async function createGuestRoomServiceOrder(formData: FormData) {
  const guestId = cookies().get("oa_guest")?.value;
  if (!guestId) redirect("/musteri/giris");

  const reservationId = String(formData.get("reservationId"));
  const itemIds = (formData.getAll("items") as string[]).filter(Boolean);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (itemIds.length === 0) redirect("/musteri?hata=siparis-bos");

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || reservation.guestId !== guestId) redirect("/musteri?hata=yetkisiz");

  const items = await prisma.menuItem.findMany({ where: { id: { in: itemIds }, isAvailable: true } });
  if (items.length === 0) redirect("/musteri?hata=urun-yok");

  await prisma.roomServiceCharge.createMany({
    data: items.map((item) => {
      const rawQty = Number(formData.get(`qty_${item.id}`) ?? 1);
      const quantity = Math.max(1, Number.isFinite(rawQty) ? rawQty : 1);
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

  revalidatePath("/musteri");
  revalidatePath("/panel");
  redirect("/musteri?ok=siparis-verildi");
}
