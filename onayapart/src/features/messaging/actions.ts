"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { sendWhatsappMessage, renderTemplate } from "@/features/messaging/whatsapp";
import { normalizePhone } from "@/shared/lib/phone";
import { sendEmail } from "@/features/messaging/email";
import { sendSms } from "@/features/messaging/sms";
import { fmtDate, fmtMoney, startOfDay } from "@/shared/lib/dates";
import { getUpcomingPayments } from "@/features/reservations/queries";

/* ------------------------- Sablon yonetimi ------------------------- */

export async function updateTemplate(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !body) redirect("/panel/bilgilendirme?hata=sablon-eksik");

  await prisma.messageTemplate.update({ where: { id }, data: { name, body } });
  redirect("/panel/bilgilendirme?ok=sablon");
}

export async function createTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!name || !body) redirect("/panel/bilgilendirme?hata=sablon-eksik");

  const key =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `sablon-${Date.now()}`;

  const count = await prisma.messageTemplate.count();
  try {
    await prisma.messageTemplate.create({ data: { key, name, body, sort: count + 1 } });
  } catch {
    redirect("/panel/bilgilendirme?hata=sablon-cakisma");
  }
  redirect("/panel/bilgilendirme?ok=sablon-eklendi");
}

export async function deleteTemplate(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.messageTemplate.delete({ where: { id } });
  redirect("/panel/bilgilendirme?ok=sablon-silindi");
}

/* ------------------------- Entegrasyon ayarlari ------------------------- */

export async function updateIntegration(formData: FormData) {
  const waEnabled = formData.get("waEnabled") === "on";
  const autoRemindersEnabled = formData.get("autoRemindersEnabled") === "on";
  const waPhoneNumberId = String(formData.get("waPhoneNumberId") ?? "").trim();
  const waAccessToken = String(formData.get("waAccessToken") ?? "").trim();

  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });

  await prisma.integrationSetting.upsert({
    where: { id: "main" },
    update: {
      waEnabled,
      autoRemindersEnabled,
      waPhoneNumberId,
      // Token alani bos birakilirsa mevcut token korunur (her kaydetmede yeniden yazmak gerekmesin).
      waAccessToken: waAccessToken || existing?.waAccessToken || "",
    },
    create: { id: "main", waEnabled, autoRemindersEnabled, waPhoneNumberId, waAccessToken },
  });

  redirect("/panel/bilgilendirme?ok=ayar");
}

export async function updateNotificationChannels(formData: FormData) {
  const emailEnabled = formData.get("emailEnabled") === "on";
  const emailApiKey = String(formData.get("emailApiKey") ?? "").trim();
  const emailFrom = String(formData.get("emailFrom") ?? "").trim();

  const smsEnabled = formData.get("smsEnabled") === "on";
  const smsUserCode = String(formData.get("smsUserCode") ?? "").trim();
  const smsPassword = String(formData.get("smsPassword") ?? "").trim();
  const smsHeader = String(formData.get("smsHeader") ?? "").trim();

  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });

  await prisma.integrationSetting.upsert({
    where: { id: "main" },
    update: {
      emailEnabled,
      emailFrom,
      emailApiKey: emailApiKey || existing?.emailApiKey || "",
      smsEnabled,
      smsHeader,
      smsUserCode,
      smsPassword: smsPassword || existing?.smsPassword || "",
    },
    create: { id: "main", emailEnabled, emailFrom, emailApiKey, smsEnabled, smsHeader, smsUserCode, smsPassword },
  });

  redirect("/panel/bilgilendirme?ok=kanal-ayar");
}

/* ------------------------- Mesaj gonderimi ------------------------- */

/** Tek bir musteriye mesaj. API acik degilse link uretilir, log'a yazilir. */
export async function sendSingleMessage(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "") || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!phone || !body) redirect("/panel/bilgilendirme?hata=mesaj-eksik");

  const result = await sendWhatsappMessage(phone, body);

  await prisma.messageLog.create({
    data: {
      guestId,
      phone,
      body,
      kind: "MANUEL",
      status: result.status,
      errorMessage: result.errorMessage ?? null,
    },
  });

  revalidatePath("/panel/bilgilendirme");

  if (result.status === "LINK_HAZIRLANDI" && result.link) {
    // API kapaliyken: kullaniciyi dogrudan WhatsApp'a yonlendir.
    redirect(result.link);
  }
  redirect(`/panel/bilgilendirme?ok=${result.status === "GONDERILDI" ? "gonderildi" : "hata"}`);
}

export async function sendSingleEmail(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "") || null;
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!to || !subject || !body) redirect("/panel/bilgilendirme?hata=eposta-eksik");

  const settings = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  const result = await sendEmail(
    {
      emailEnabled: settings?.emailEnabled ?? false,
      emailApiKey: settings?.emailApiKey ?? "",
      emailFrom: settings?.emailFrom ?? "",
    },
    to,
    subject,
    body.replace(/\n/g, "<br>")
  );

  await prisma.messageLog.create({
    data: {
      guestId,
      phone: to,
      body: `[E-POSTA] ${subject}\n${body}`,
      kind: "MANUEL",
      status: result.ok ? "GONDERILDI" : "HATA",
      errorMessage: result.error ?? null,
    },
  });

  revalidatePath("/panel/bilgilendirme");
  redirect(`/panel/bilgilendirme?ok=${result.ok ? "eposta-gonderildi" : "eposta-hata"}`);
}

export async function sendSingleSms(formData: FormData) {
  const guestId = String(formData.get("guestId") ?? "") || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!phone || !body) redirect("/panel/bilgilendirme?hata=sms-eksik");

  const settings = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  const result = await sendSms(
    {
      smsEnabled: settings?.smsEnabled ?? false,
      smsUserCode: settings?.smsUserCode ?? "",
      smsPassword: settings?.smsPassword ?? "",
      smsHeader: settings?.smsHeader ?? "",
    },
    normalizePhone(phone),
    body
  );

  await prisma.messageLog.create({
    data: {
      guestId,
      phone,
      body: `[SMS] ${body}`,
      kind: "MANUEL",
      status: result.ok ? "GONDERILDI" : "HATA",
      errorMessage: result.error ?? null,
    },
  });

  revalidatePath("/panel/bilgilendirme");
  redirect(`/panel/bilgilendirme?ok=${result.ok ? "sms-gonderildi" : "sms-hata"}`);
}

/** Secilen musterilere toplu gonderim. */
export async function sendBulkMessage(formData: FormData) {
  const guestIds = formData.getAll("guestIds") as string[];
  const templateBody = String(formData.get("body") ?? "").trim();

  if (!templateBody || guestIds.length === 0) redirect("/panel/bilgilendirme?hata=toplu-eksik");

  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds } },
    include: {
      reservations: { orderBy: { checkIn: "desc" }, take: 1, include: { room: true, payments: true } },
    },
  });

  let sent = 0;
  let prepared = 0;
  let failed = 0;

  for (const g of guests) {
    const res = g.reservations[0];
    const paid = res ? res.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0) : 0;
    const body = renderTemplate(templateBody, {
      ad: g.fullName,
      oda: res ? String(res.room.number) : "",
      tutar: res ? fmtMoney(Math.max(0, res.totalAmount - paid)) : "",
      tarih: fmtDate(new Date()),
      kod: g.portalCode,
    });

    const result = await sendWhatsappMessage(g.phone, body);
    if (result.status === "GONDERILDI") sent++;
    else if (result.status === "LINK_HAZIRLANDI") prepared++;
    else failed++;

    await prisma.messageLog.create({
      data: {
        guestId: g.id,
        phone: g.phone,
        body,
        kind: "TOPLU",
        status: result.status,
        errorMessage: result.errorMessage ?? null,
      },
    });
  }

  revalidatePath("/panel/bilgilendirme");
  redirect(`/panel/bilgilendirme?ok=toplu&gonderildi=${sent}&hazir=${prepared}&hata=${failed}`);
}

/** Odeme gunu gelmis musterilere hatirlatma. Ayni ay icinde ikinci kez gonderilmez. */
export async function sendPaymentReminders(formData: FormData) {
  const onlyReservationId = String(formData.get("reservationId") ?? "") || null;

  const template = await prisma.messageTemplate.findUnique({ where: { key: "odeme-hatirlatma" } });
  if (!template) redirect("/panel/bilgilendirme?hata=sablon-yok");

  const today = startOfDay(new Date());
  const periodKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const due = await getUpcomingPayments(0);
  const targets = onlyReservationId ? due.filter((d) => d.reservation.id === onlyReservationId) : due;

  const alreadySent = await prisma.messageLog.findMany({
    where: { kind: "ODEME_HATIRLATMA", periodKey, status: { in: ["GONDERILDI", "LINK_HAZIRLANDI"] } },
    select: { reservationId: true },
  });
  const sentIds = new Set(alreadySent.map((m: { reservationId: string | null }) => m.reservationId));

  let sent = 0;
  let prepared = 0;
  let failed = 0;
  let singleLink: string | null = null;

  for (const d of targets) {
    if (sentIds.has(d.reservation.id)) continue;

    const body = renderTemplate(template.body, {
      ad: d.guest.fullName,
      oda: String(d.room.number),
      tutar: fmtMoney(d.amount),
      tarih: fmtDate(d.dueDate),
      kod: "",
    });

    const result = await sendWhatsappMessage(d.guest.phone, body);
    if (result.status === "GONDERILDI") sent++;
    else if (result.status === "LINK_HAZIRLANDI") {
      prepared++;
      if (onlyReservationId) singleLink = result.link ?? null;
    } else failed++;

    await prisma.messageLog.create({
      data: {
        guestId: d.guest.id,
        reservationId: d.reservation.id,
        phone: d.guest.phone,
        body,
        kind: "ODEME_HATIRLATMA",
        periodKey,
        status: result.status,
        errorMessage: result.errorMessage ?? null,
      },
    });
  }

  revalidatePath("/panel/bilgilendirme");
  revalidatePath("/panel");

  if (singleLink) redirect(singleLink);
  redirect(`/panel/bilgilendirme?ok=hatirlatma&gonderildi=${sent}&hazir=${prepared}&hata=${failed}`);
}
