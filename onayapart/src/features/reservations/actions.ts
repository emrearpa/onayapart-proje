"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { isUniqueViolation, prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import { checked, date, optStr, parseDate, positiveNum, str, strList } from "@/shared/lib/form";
import { normalizePhone } from "@/shared/lib/phone";
import { site } from "@/shared/lib/site";
import { textToHtml } from "@/shared/lib/text";
import { can, getPanelSession, requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { sendEmail } from "@/features/messaging/email";
import { sendSms } from "@/features/messaging/sms";
import {
  ACTIVE_RESERVATION_STATUSES,
  RESERVATION_STATUSES,
  STAY_TYPE_LABEL,
  isPaymentMethod,
  type ReservationStatus,
} from "@/features/reservations/constants";
import { findGuestIdByPhone } from "@/features/reservations/queries";

const LIST_PATH = "/panel/rezervasyonlar";
const guestPath = (guestId: string) => `/panel/musteriler/${guestId}`;
const ID_TYPES = ["TC", "PASAPORT"];
const MAX_CODE_ATTEMPTS = 5;

function revalidateReservations() {
  revalidatePath("/panel", "layout");
  revalidatePath("/", "layout");
}

/** Ayni odada, verilen aralikla cakisan kayit var mi? Kendi rezervasyonlarimiz ve Booking/Airbnb birlikte. */
async function findClash(roomId: string, checkIn: Date, checkOut: Date, ignoreReservationId?: string) {
  const [own, external] = await Promise.all([
    prisma.reservation.findFirst({
      where: {
        id: ignoreReservationId ? { not: ignoreReservationId } : undefined,
        roomId,
        status: { in: ACTIVE_RESERVATION_STATUSES },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { id: true },
    }),
    prisma.externalBooking.findFirst({
      where: { roomId, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
      select: { id: true },
    }),
  ]);
  return own ? "own" : external ? "external" : null;
}

/** Sirali, okunakli rezervasyon kodu (RZ-1001, RZ-1002 ...). */
async function nextReservationCode(tx: Prisma.TransactionClient, offset: number): Promise<string> {
  const codes = await tx.reservation.findMany({ select: { code: true } });
  const highest = codes.reduce((max, r) => Math.max(max, Number(r.code.replace(/\D/g, "")) || 0), 1000);
  return `RZ-${highest + 1 + offset}`;
}

/**
 * "Daha once kalmis mi?" aramasi - telefon numarasindan gecmis bir misafiri bulup
 * rezervasyon formunu onun bilgileriyle doldurmak icin yonlendirir.
 */
export async function findGuestByPhone(formData: FormData) {
  await requirePanel("rezervasyonlar");
  const phone = str(formData, "phone");
  if (!phone) redirect(`${LIST_PATH}?hata=telefon-eksik`);

  const guestId = await findGuestIdByPhone(phone);
  if (!guestId) redirect(`${LIST_PATH}?hata=misafir-bulunamadi`);
  redirect(`${LIST_PATH}?misafir=${guestId}#yeni-rezervasyon`);
}

/** Formda "+ Bir kisi daha ekle" ile eklenen satirlar; her alan ayni `name` ile tekrarlanir. */
function readExtraGuestRows(formData: FormData) {
  const names = strList(formData, "eg_name");
  const column = (key: string) => strList(formData, key);
  const [idTypes, idNumbers, birthDates, nationalities, phones, fees] = [
    column("eg_idType"),
    column("eg_idNumber"),
    column("eg_birthDate"),
    column("eg_nationality"),
    column("eg_phone"),
    column("eg_fee"),
  ];

  return names
    .map((fullName, i) => {
      const fee = Number(fees[i]);
      return {
        fullName,
        idType: ID_TYPES.includes(idTypes[i]) ? idTypes[i] : "TC",
        idNumber: idNumbers[i] || null,
        birthDate: parseDate(birthDates[i]),
        nationality: nationalities[i] || "T.C.",
        phone: phones[i] || null,
        fee: Number.isFinite(fee) && fee > 0 ? fee : 0,
      };
    })
    .filter((row) => row.fullName);
}

/** Onay bildirimi - kanal(lar) aciksa gonderilir. Basarisiz olsa da rezervasyonu bozmaz. */
async function notifyReservationConfirmed(
  guest: { fullName: string; phone: string; email: string | null },
  reservation: { code: string; checkIn: Date; checkOut: Date; roomNumber: number }
) {
  try {
    const settings = await getIntegrationSettings();
    const text = `Sayın ${guest.fullName}, ${site.name}'ta ${reservation.roomNumber} numaralı dairede ${fmtDate(reservation.checkIn)} - ${fmtDate(reservation.checkOut)} tarihleri arasında rezervasyonunuz onaylanmıştır. Sözleşme no: ${reservation.code}.`;

    await Promise.all([
      guest.email ? sendEmail(settings, guest.email, `${site.shortName} — Rezervasyonunuz Onaylandı`, textToHtml(text)) : null,
      guest.phone ? sendSms(settings, normalizePhone(guest.phone), text) : null,
    ]);
  } catch (error) {
    console.error("[rezervasyon] onay bildirimi gonderilemedi:", error);
  }
}

export async function createReservation(formData: FormData) {
  await requirePanel("rezervasyonlar");

  const roomId = str(formData, "roomId");
  const fullName = str(formData, "fullName");
  const phone = str(formData, "phone");
  const checkIn = date(formData, "checkIn");
  const checkOut = date(formData, "checkOut");
  const stayType = str(formData, "stayType");
  const handledByEmployeeId = str(formData, "handledByEmployeeId");

  if (!roomId || !fullName || !phone || !checkIn || !checkOut || checkOut <= checkIn || !(stayType in STAY_TYPE_LABEL)) {
    redirect(`${LIST_PATH}?hata=eksik`);
  }
  // Rezervasyonu alan personel zorunlu - kim hangi rezervasyonu almis bilinsin diye.
  if (!handledByEmployeeId) redirect(`${LIST_PATH}?hata=personel-eksik`);

  const clash = await findClash(roomId, checkIn, checkOut);
  if (clash) redirect(`${LIST_PATH}?hata=${clash === "own" ? "cakisma" : "cakisma-harici"}`);

  // Kimlik ve iletisim bilgileri - musteri panelinde ve sozlesmede kullanilir. Bos
  // birakilan alanlar, daha once kayitli bir misafirin mevcut bilgisini silmez.
  const idType = str(formData, "idType");
  const birthDate = date(formData, "birthDate");
  const guestData = {
    fullName,
    idType: ID_TYPES.includes(idType) ? idType : "TC",
    nationality: str(formData, "nationality") || "TR",
    ...(str(formData, "idNumber") ? { idNumber: str(formData, "idNumber") } : {}),
    ...(birthDate ? { birthDate } : {}),
    ...(str(formData, "email") ? { email: str(formData, "email") } : {}),
    ...(str(formData, "address") ? { address: str(formData, "address") } : {}),
  };

  const extraGuests = readExtraGuestRows(formData);
  const extraGuestFees = extraGuests.reduce((sum, eg) => sum + eg.fee, 0);
  // Ayni telefonla daha once kayit acilmissa yeni misafir acmak yerine mevcut kaydi guncelleriz.
  const existingGuestId = await findGuestIdByPhone(phone);

  let created: { id: string; code: string; roomNumber: number; guest: { fullName: string; phone: string; email: string | null } } | null = null;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !created; attempt++) {
    try {
      created = await prisma.$transaction(async (tx) => {
        const guest = existingGuestId
          ? await tx.guest.update({ where: { id: existingGuestId }, data: guestData })
          : await tx.guest.create({ data: { phone, ...guestData } });

        const reservation = await tx.reservation.create({
          data: {
            code: await nextReservationCode(tx, attempt),
            roomId,
            guestId: guest.id,
            checkIn,
            checkOut,
            stayType,
            totalAmount: positiveNum(formData, "totalAmount") + extraGuestFees,
            deposit: positiveNum(formData, "deposit"),
            handledByEmployeeId,
            notes: optStr(formData, "notes"),
            // Kurumsal musteri: fatura kisiye degil firmaya kesilecekse.
            billToCompany: checked(formData, "billToCompany"),
            companyName: optStr(formData, "companyName"),
            companyTaxNo: optStr(formData, "companyTaxNo"),
            companyTaxOffice: optStr(formData, "companyTaxOffice"),
            companyAddress: optStr(formData, "companyAddress"),
            extraGuests: { create: extraGuests },
          },
          include: { room: { select: { number: true } } },
        });
        return { id: reservation.id, code: reservation.code, roomNumber: reservation.room.number, guest };
      });
    } catch (error) {
      // Ayni anda acilan iki rezervasyon ayni kodu alirsa bir sonraki kodla tekrar dene.
      if (!isUniqueViolation(error)) throw error;
    }
  }
  if (!created) redirect(`${LIST_PATH}?hata=eksik`);

  await logActivity(
    "Rezervasyon oluşturdu",
    `${created.code} · ${created.guest.fullName} · Oda ${created.roomNumber} · ${fmtDate(checkIn)} → ${fmtDate(checkOut)}`,
    created.id
  );
  if (extraGuests.length > 0) {
    await logActivity("Rezervasyonla birlikte ek misafir ekledi", `${created.code} · ${extraGuests.length} kişi`, created.id);
  }
  await notifyReservationConfirmed(created.guest, { code: created.code, checkIn, checkOut, roomNumber: created.roomNumber });

  revalidateReservations();
  redirect(`${LIST_PATH}?ok=1`);
}

export async function setReservationStatus(formData: FormData) {
  await requirePanel("rezervasyonlar");
  const id = str(formData, "id");
  const status = str(formData, "status") as ReservationStatus;
  if (!RESERVATION_STATUSES.includes(status)) return;

  const previous = await prisma.reservation.findUnique({ where: { id }, select: { status: true } });
  if (!previous || previous.status === status) return;

  const reservation = await prisma.reservation.update({ where: { id }, data: { status }, include: { guest: true, room: true } });
  await logActivity("Rezervasyon durumunu değiştirdi", `${reservation.code} · ${reservation.guest.fullName} · yeni durum: ${status}`, id);

  // Cikis (TAMAMLANDI) yapildiginda oda otomatik "Temizlikte" olur ve kat hizmetleri
  // icin bir temizlik gorevi acilir.
  if (status === "TAMAMLANDI") {
    await prisma.$transaction([
      prisma.room.update({ where: { id: reservation.roomId }, data: { condition: "TEMIZLIK" } }),
      prisma.task.create({
        data: {
          roomId: reservation.roomId,
          guestId: reservation.guestId,
          kind: "TEMIZLIK",
          title: `Oda ${reservation.room.number} — çıkış sonrası temizlik`,
          message: `${reservation.guest.fullName} çıkış yaptı (${reservation.code}). Oda müsaitliğe alınmadan önce temizlenmeli.`,
        },
      }),
    ]);
    await logActivity("Otomatik temizlik görevi açtı", `Oda ${reservation.room.number} · ${reservation.code}`, id);
  }

  revalidateReservations();
}

/**
 * Takvimde surukle-birak ile bir rezervasyonu baska bir odaya/tarihe tasir.
 * Form action degil, dogrudan istemci bilesenden cagrilir - bu yuzden redirect
 * atmaz, sonucu duz bir nesne olarak dondurur.
 */
export async function moveReservation(
  reservationId: string,
  newRoomId: string,
  newCheckInISO: string
): Promise<{ ok: boolean; error?: string }> {
  if (!can(await getPanelSession(), "rezervasyonlar")) return { ok: false, error: "Bu işlem için yetkiniz yok." };

  const newCheckIn = parseDate(newCheckInISO);
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation || !newCheckIn) return { ok: false, error: "Rezervasyon bulunamadı." };

  const newCheckOut = new Date(newCheckIn.getTime() + (reservation.checkOut.getTime() - reservation.checkIn.getTime()));

  const clash = await findClash(newRoomId, newCheckIn, newCheckOut, reservationId);
  if (clash === "own") return { ok: false, error: "Seçilen tarihte bu odada başka bir rezervasyon var." };
  if (clash === "external") return { ok: false, error: "Seçilen tarihte bu oda Booking.com/Airbnb üzerinden dolu görünüyor." };

  const updated = await prisma.reservation.update({
    where: { id: reservationId },
    data: { roomId: newRoomId, checkIn: newCheckIn, checkOut: newCheckOut },
    include: { guest: true, room: true },
  });

  await logActivity(
    "Rezervasyonu takvimde taşıdı",
    `${updated.code} · ${updated.guest.fullName} · Oda ${updated.room.number} · yeni giriş: ${fmtDate(newCheckIn)}`,
    updated.id
  );
  revalidateReservations();
  return { ok: true };
}

export async function toggleKbs(formData: FormData) {
  await requirePanel("rezervasyonlar");
  await prisma.reservation.update({ where: { id: str(formData, "id") }, data: { kbsReported: checked(formData, "value") } });
  revalidatePath("/panel", "layout");
}

export async function addPayment(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const reservationId = str(formData, "reservationId");
  const amount = positiveNum(formData, "amount");
  const method = str(formData, "method");
  if (!amount || !isPaymentMethod(method)) return;

  const payment = await prisma.payment.create({
    data: { reservationId, amount, method, accountId: optStr(formData, "accountId") },
    include: { reservation: { select: { code: true } } },
  });
  await logActivity("Tahsilat girdi", `${payment.reservation.code} · ${fmtMoney(amount)} · ${method}`, reservationId);

  // "Fatura kesilsin mi?" isaretlendiyse fatura bekleme listesine eklenir. Tutar odemenin
  // tamami olmak zorunda degil - musteri sadece bir kismi icin isteyebilir.
  if (checked(formData, "invoiceRequested")) {
    const requested = positiveNum(formData, "invoiceAmount");
    const invoiceAmount = requested && requested <= amount ? requested : amount;
    await prisma.invoice.create({
      data: {
        reservationId,
        paymentId: payment.id,
        amount: invoiceAmount,
        status: "BEKLIYOR",
        note: `Nakit ödeme sırasında talep edildi (ödenen: ${fmtMoney(amount)})`,
      },
    });
    await logActivity("Nakit ödemede fatura talep edildi", `${payment.reservation.code} · ${fmtMoney(invoiceAmount)}`, reservationId);
  }

  revalidatePath("/panel", "layout");
}

/* ---------------------------------------------------------------- */
/* Ek misafirler - kiraciyla birlikte kalan, ekstra ucretli kisi.    */
/* Ucret, rezervasyon toplamina ayni islemde eklenir/cikarilir.      */
/* ---------------------------------------------------------------- */

export async function createExtraGuest(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const reservationId = str(formData, "reservationId");
  const back = guestPath(str(formData, "guestId"));
  const fullName = str(formData, "fullName");
  if (!fullName) redirect(`${back}?hata=misafir-eksik`);

  const idType = str(formData, "idType");
  const fee = positiveNum(formData, "fee");

  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      totalAmount: { increment: fee },
      extraGuests: {
        create: {
          fullName,
          idType: ID_TYPES.includes(idType) ? idType : "TC",
          idNumber: optStr(formData, "idNumber"),
          birthDate: date(formData, "birthDate"),
          nationality: str(formData, "nationality") || "T.C.",
          phone: optStr(formData, "phone"),
          fee,
          note: optStr(formData, "note"),
        },
      },
    },
  });

  await logActivity("Ek misafir ekledi", `${fullName}${fee ? ` · ${fmtMoney(fee)} ek ücret` : ""}`, reservationId);
  revalidatePath("/panel", "layout");
  redirect(`${back}?ok=misafir-eklendi`);
}

export async function deleteExtraGuest(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const id = str(formData, "id");

  const extra = await prisma.extraGuest.findUnique({ where: { id } });
  if (extra) {
    await prisma.$transaction([
      prisma.extraGuest.delete({ where: { id } }),
      prisma.reservation.update({ where: { id: extra.reservationId }, data: { totalAmount: { decrement: extra.fee } } }),
    ]);
    await logActivity("Ek misafir sildi", extra.fullName, extra.reservationId);
  }

  revalidatePath("/panel", "layout");
  redirect(`${guestPath(str(formData, "guestId"))}?ok=misafir-silindi`);
}

/* ---------------------------------------------------------------- */
/* Oda servisi - restorandan odaya giden yemek/icecek hesabi.        */
/* Yalnizca ONAYLANDI durumundaki kalemler rezervasyon toplamina     */
/* islenir; bekleyen/reddedilen siparisler tutari etkilemez.         */
/* ---------------------------------------------------------------- */

export async function addRoomServiceCharge(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const reservationId = str(formData, "reservationId");
  const back = guestPath(str(formData, "guestId"));
  const menuItemId = optStr(formData, "menuItemId");
  const quantity = Math.max(1, Math.trunc(positiveNum(formData, "quantity")) || 1);

  const menuItem = menuItemId ? await prisma.menuItem.findUnique({ where: { id: menuItemId } }) : null;
  const name = menuItem?.name ?? str(formData, "customName");
  const unitPrice = menuItem?.price ?? positiveNum(formData, "customPrice");
  if (!name || unitPrice <= 0) redirect(`${back}?hata=servis-eksik`);

  const amount = unitPrice * quantity;
  await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      totalAmount: { increment: amount },
      roomServiceCharges: {
        create: { menuItemId: menuItem?.id ?? null, name, unitPrice, quantity, amount, note: optStr(formData, "note"), status: "ONAYLANDI", source: "PERSONEL" },
      },
    },
  });

  await logActivity("Oda servisi hesabına ekledi", `${name} x${quantity} · ${fmtMoney(amount)}`, reservationId);
  revalidatePath("/panel", "layout");
  redirect(`${back}?ok=servis-eklendi`);
}

export async function deleteRoomServiceCharge(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const id = str(formData, "id");

  const charge = await prisma.roomServiceCharge.findUnique({ where: { id } });
  if (charge) {
    await prisma.$transaction([
      prisma.roomServiceCharge.delete({ where: { id } }),
      ...(charge.status === "ONAYLANDI"
        ? [prisma.reservation.update({ where: { id: charge.reservationId }, data: { totalAmount: { decrement: charge.amount } } })]
        : []),
    ]);
    await logActivity("Oda servisi kaydını sildi", charge.name, charge.reservationId);
  }

  revalidatePath("/panel", "layout");
  redirect(`${guestPath(str(formData, "guestId"))}?ok=servis-silindi`);
}

/** Misafirin kendi panelinden verdigi bekleyen siparisi onaylar - o an rezervasyon tutarina islenir. */
export async function approveRoomServiceCharge(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const id = str(formData, "id");
  const back = guestPath(str(formData, "guestId"));

  // Durum kosulu sorgunun icinde: iki kez tiklansa da tutar yalnizca bir kez islenir.
  const charge = await prisma.roomServiceCharge.findUnique({ where: { id } });
  if (!charge) redirect(back);
  const { count } = await prisma.roomServiceCharge.updateMany({ where: { id, status: "BEKLIYOR" }, data: { status: "ONAYLANDI" } });
  if (count === 0) redirect(back);

  await prisma.reservation.update({ where: { id: charge.reservationId }, data: { totalAmount: { increment: charge.amount } } });
  await logActivity("Misafir siparişini onayladı", `${charge.name} · ${fmtMoney(charge.amount)}`, charge.reservationId);
  revalidatePath("/panel", "layout");
  redirect(`${back}?ok=servis-onaylandi`);
}

/** Bekleyen bir misafir siparisini reddeder - tutara islenmez, kayit gecmis icin kalir. */
export async function rejectRoomServiceCharge(formData: FormData) {
  await requirePanel("rezervasyonlar", "musteriler");
  const id = str(formData, "id");
  const back = guestPath(str(formData, "guestId"));

  const charge = await prisma.roomServiceCharge.findUnique({ where: { id } });
  if (!charge) redirect(back);
  const { count } = await prisma.roomServiceCharge.updateMany({ where: { id, status: "BEKLIYOR" }, data: { status: "REDDEDILDI" } });
  if (count === 0) redirect(back);

  await logActivity("Misafir siparişini reddetti", charge.name, charge.reservationId);
  revalidatePath("/panel", "layout");
  redirect(`${back}?ok=servis-reddedildi`);
}
