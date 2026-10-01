"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueViolation, prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import { checked, optStr, str, strList } from "@/shared/lib/form";
import { normalizePhone } from "@/shared/lib/phone";
import { fillPlaceholders, slugify, textToHtml } from "@/shared/lib/text";
import { requirePanel } from "@/features/auth/guards";
import { getIntegrationSettings, updateIntegrationSettings } from "@/features/integrations/settings";
import { sendEmail } from "@/features/messaging/email";
import { sendSms } from "@/features/messaging/sms";
import { sendWhatsappMessage, type SendResult } from "@/features/messaging/whatsapp";
import { currentPeriodKey, getRemindedReservationIds, getUpcomingPayments } from "@/features/reservations/queries";

const PAGE_PATH = "/panel/bilgilendirme";
const PAYMENT_REMINDER_TEMPLATE = "odeme-hatirlatma";

function fail(reason: string): never {
  redirect(`${PAGE_PATH}?hata=${reason}`);
}

function done(query: string): never {
  revalidatePath("/panel", "layout");
  redirect(`${PAGE_PATH}?${query}`);
}

/** Gonderim sonuclarini sayar ve ozet sorgu dizesine cevirir. */
function createTally() {
  const counts = { GONDERILDI: 0, LINK_HAZIRLANDI: 0, HATA: 0 };
  return {
    add: (status: SendResult["status"]) => void counts[status]++,
    query: (ok: string) => `ok=${ok}&gonderildi=${counts.GONDERILDI}&hazir=${counts.LINK_HAZIRLANDI}&hata=${counts.HATA}`,
  };
}

/* ------------------------- Sablon yonetimi ------------------------- */

export async function updateTemplate(formData: FormData) {
  await requirePanel("bilgilendirme");
  const name = str(formData, "name");
  const body = str(formData, "body");
  if (!name || !body) fail("sablon-eksik");

  await prisma.messageTemplate.update({ where: { id: str(formData, "id") }, data: { name, body } });
  done("ok=sablon");
}

export async function createTemplate(formData: FormData) {
  await requirePanel("bilgilendirme");
  const name = str(formData, "name");
  const body = str(formData, "body");
  if (!name || !body) fail("sablon-eksik");

  try {
    const count = await prisma.messageTemplate.count();
    await prisma.messageTemplate.create({ data: { key: slugify(name, `sablon-${Date.now()}`), name, body, sort: count + 1 } });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    fail("sablon-cakisma");
  }
  done("ok=sablon-eklendi");
}

export async function deleteTemplate(formData: FormData) {
  await requirePanel("bilgilendirme");
  await prisma.messageTemplate.delete({ where: { id: str(formData, "id") } });
  done("ok=sablon-silindi");
}

/* ------------------------- Entegrasyon ayarlari ------------------------- */

export async function updateIntegration(formData: FormData) {
  await requirePanel("bilgilendirme");
  await updateIntegrationSettings(
    {
      waEnabled: checked(formData, "waEnabled"),
      autoRemindersEnabled: checked(formData, "autoRemindersEnabled"),
      waPhoneNumberId: str(formData, "waPhoneNumberId"),
    },
    { waAccessToken: str(formData, "waAccessToken") }
  );
  done("ok=ayar");
}

export async function updateNotificationChannels(formData: FormData) {
  await requirePanel("bilgilendirme");
  await updateIntegrationSettings(
    {
      emailEnabled: checked(formData, "emailEnabled"),
      emailFrom: str(formData, "emailFrom"),
      smsEnabled: checked(formData, "smsEnabled"),
      smsHeader: str(formData, "smsHeader"),
      smsUserCode: str(formData, "smsUserCode"),
    },
    { emailApiKey: str(formData, "emailApiKey"), smsPassword: str(formData, "smsPassword") }
  );
  done("ok=kanal-ayar");
}

/* ------------------------- Tekil gonderim ------------------------- */

/** Tek bir musteriye WhatsApp mesaji. API acik degilse hazir mesaj linki uretilir. */
export async function sendSingleMessage(formData: FormData) {
  await requirePanel("bilgilendirme");
  const phone = str(formData, "phone");
  const body = str(formData, "body");
  if (!phone || !body) fail("mesaj-eksik");

  const result = await sendWhatsappMessage(phone, body);
  await prisma.messageLog.create({
    data: { guestId: optStr(formData, "guestId"), phone, body, kind: "MANUEL", status: result.status, errorMessage: result.errorMessage ?? null },
  });
  revalidatePath("/panel", "layout");

  // API kapaliyken kullaniciyi dogrudan WhatsApp'a yonlendir.
  if (result.status === "LINK_HAZIRLANDI" && result.link) redirect(result.link);
  done(`ok=${result.status === "GONDERILDI" ? "gonderildi" : "hata"}`);
}

export async function sendSingleEmail(formData: FormData) {
  await requirePanel("bilgilendirme");
  const to = str(formData, "to");
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  if (!to || !subject || !body) fail("eposta-eksik");

  const result = await sendEmail(await getIntegrationSettings(), to, subject, textToHtml(body));
  await prisma.messageLog.create({
    data: {
      guestId: optStr(formData, "guestId"),
      phone: to,
      body: `[E-POSTA] ${subject}\n${body}`,
      kind: "MANUEL",
      status: result.ok ? "GONDERILDI" : "HATA",
      errorMessage: result.error ?? null,
    },
  });
  done(`ok=${result.ok ? "eposta-gonderildi" : "eposta-hata"}`);
}

export async function sendSingleSms(formData: FormData) {
  await requirePanel("bilgilendirme");
  const phone = str(formData, "phone");
  const body = str(formData, "body");
  if (!phone || !body) fail("sms-eksik");

  const result = await sendSms(await getIntegrationSettings(), normalizePhone(phone), body);
  await prisma.messageLog.create({
    data: {
      guestId: optStr(formData, "guestId"),
      phone,
      body: `[SMS] ${body}`,
      kind: "MANUEL",
      status: result.ok ? "GONDERILDI" : "HATA",
      errorMessage: result.error ?? null,
    },
  });
  done(`ok=${result.ok ? "sms-gonderildi" : "sms-hata"}`);
}

/* ------------------------- Toplu gonderim ------------------------- */

/** Secilen musterilere, sablondaki yer tutucular doldurularak toplu gonderim. */
export async function sendBulkMessage(formData: FormData) {
  await requirePanel("bilgilendirme");
  const guestIds = strList(formData, "guestIds").filter(Boolean);
  const template = str(formData, "body");
  if (!template || guestIds.length === 0) fail("toplu-eksik");

  const guests = await prisma.guest.findMany({
    where: { id: { in: guestIds } },
    include: { reservations: { orderBy: { checkIn: "desc" }, take: 1, include: { room: true, payments: { select: { amount: true } } } } },
  });

  const tally = createTally();
  for (const guest of guests) {
    const reservation = guest.reservations[0];
    const paid = reservation?.payments.reduce((s, p) => s + p.amount, 0) ?? 0;
    const body = fillPlaceholders(template, {
      ad: guest.fullName,
      oda: reservation ? String(reservation.room.number) : "",
      tutar: reservation ? fmtMoney(Math.max(0, reservation.totalAmount - paid)) : "",
      tarih: fmtDate(new Date()),
      kod: reservation?.code ?? "",
    });

    const result = await sendWhatsappMessage(guest.phone, body);
    tally.add(result.status);
    await prisma.messageLog.create({
      data: { guestId: guest.id, phone: guest.phone, body, kind: "TOPLU", status: result.status, errorMessage: result.errorMessage ?? null },
    });
  }

  done(tally.query("toplu"));
}

/** Odeme gunu gelmis musterilere hatirlatma. Ayni ay icinde ikinci kez gonderilmez. */
export async function sendPaymentReminders(formData: FormData) {
  await requirePanel("bilgilendirme");
  const onlyReservationId = optStr(formData, "reservationId");

  const template = await prisma.messageTemplate.findUnique({ where: { key: PAYMENT_REMINDER_TEMPLATE } });
  if (!template) fail("sablon-yok");

  const periodKey = currentPeriodKey();
  const [due, remindedIds] = await Promise.all([getUpcomingPayments(0), getRemindedReservationIds(periodKey)]);
  const targets = due.filter(
    (d) => !remindedIds.has(d.reservation.id) && (!onlyReservationId || d.reservation.id === onlyReservationId)
  );

  const tally = createTally();
  let singleLink: string | undefined;

  for (const target of targets) {
    const body = fillPlaceholders(template.body, {
      ad: target.guest.fullName,
      oda: String(target.room.number),
      tutar: fmtMoney(target.amount),
      tarih: fmtDate(target.dueDate),
      kod: target.reservation.code,
    });

    const result = await sendWhatsappMessage(target.guest.phone, body);
    tally.add(result.status);
    if (onlyReservationId && result.status === "LINK_HAZIRLANDI") singleLink = result.link;

    await prisma.messageLog.create({
      data: {
        guestId: target.guest.id,
        reservationId: target.reservation.id,
        phone: target.guest.phone,
        body,
        kind: "ODEME_HATIRLATMA",
        periodKey,
        status: result.status,
        errorMessage: result.errorMessage ?? null,
      },
    });
  }

  revalidatePath("/panel", "layout");
  if (singleLink) redirect(singleLink);
  done(tally.query("hatirlatma"));
}
