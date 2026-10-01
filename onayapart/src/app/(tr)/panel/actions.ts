"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { verifyPassword, createStaffSessionToken, pathForPermission } from "@/lib/staffAuth";
import { logActivity } from "@/lib/activityLog";
import { fmtDate, fmtMoney } from "@/lib/dates";
import { site } from "@/lib/site";

function revalidateSite() {
  revalidatePath("/", "layout");
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== process.env.PANEL_PASSWORD) {
    redirect("/panel/giris?hata=1");
  }
  cookies().set("oa_panel", password, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/panel");
}

/** Sinirli yetkili personel girisi. Basariliysa izinlerini iceren imzali bir token cerezini yazar. */
export async function staffLogin(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = username ? await prisma.staffUser.findUnique({ where: { username } }) : null;
  if (!user || !user.isActive) redirect("/panel/giris?hata=personel");

  const ok = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) redirect("/panel/giris?hata=personel");

  const permissions = user.permissions ? user.permissions.split(",").filter(Boolean) : [];
  const token = await createStaffSessionToken(process.env.PANEL_PASSWORD ?? "", {
    userId: user.id,
    fullName: user.fullName,
    permissions,
  });

  cookies().set("oa_staff", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  await prisma.staffUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  redirect(permissions[0] ? pathForPermission(permissions[0]) : "/panel/giris");
}

export async function logout() {
  cookies().delete("oa_panel");
  cookies().delete("oa_staff");
  redirect("/panel/giris");
}

/** Odanin temizlik/bakim durumunu degistirir ve site sayfalarini tazeler. */
export async function setRoomCondition(formData: FormData) {
  const id = String(formData.get("id"));
  const condition = String(formData.get("condition"));
  await prisma.room.update({ where: { id }, data: { condition } });
  revalidatePath("/", "layout");
}

export async function setRoomPublished(formData: FormData) {
  const id = String(formData.get("id"));
  const isPublished = formData.get("isPublished") === "true";
  await prisma.room.update({ where: { id }, data: { isPublished } });
  revalidatePath("/", "layout");
}

export async function setRate(formData: FormData) {
  const id = String(formData.get("id"));
  const price = Number(formData.get("price") ?? 0);
  const rate = await prisma.rate.update({
    where: { id },
    data: { price: Number.isFinite(price) ? price : 0 },
    include: { type: true },
  });
  await logActivity("Fiyat güncelledi", `${rate.type.name} · ${rate.label} · ${fmtMoney(rate.price)}`);
  revalidatePath("/", "layout");
}

function generatePortalCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * "Daha once kalmis mi?" arama - telefon numarasindan (hangi formatta yazilirsa
 * yazilsin) gecmis bir misafiri bulup rezervasyon formunu onun bilgileriyle
 * doldurmak icin yonlendirir.
 */
export async function findGuestByPhone(formData: FormData) {
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  if (!phoneRaw) redirect("/panel/rezervasyonlar?hata=telefon-eksik");

  const { normalizePhone } = await import("@/lib/whatsapp");
  const normalizedInput = normalizePhone(phoneRaw);

  const allGuestPhones = await prisma.guest.findMany({ select: { id: true, phone: true } });
  const match = allGuestPhones.find((g) => normalizePhone(g.phone) === normalizedInput);

  if (!match) redirect("/panel/rezervasyonlar?hata=misafir-bulunamadi");
  redirect(`/panel/rezervasyonlar?misafir=${match.id}#yeni-rezervasyon`);
}

export async function createReservation(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const checkIn = new Date(String(formData.get("checkIn")));
  const checkOut = new Date(String(formData.get("checkOut")));
  const stayType = String(formData.get("stayType") ?? "GUNLUK");
  const totalAmount = Number(formData.get("totalAmount") ?? 0);
  const deposit = Number(formData.get("deposit") ?? 0);

  // Kimlik ve iletisim bilgileri - musteri panelinde ve sozlesmede kullanilir.
  const idType = String(formData.get("idType") ?? "TC");
  const idNumber = String(formData.get("idNumber") ?? "").trim();
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "TR").trim() || "TR";
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  // Rezervasyonu alan personel - zorunlu, kim ne rezervasyonu almis bilinsin diye.
  const handledByEmployeeId = String(formData.get("handledByEmployeeId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  // Kurumsal musteri: fatura kisiye degil firmaya kesilecekse.
  const billToCompany = formData.get("billToCompany") === "on";
  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const companyTaxNo = String(formData.get("companyTaxNo") ?? "").trim() || null;
  const companyTaxOffice = String(formData.get("companyTaxOffice") ?? "").trim() || null;
  const companyAddress = String(formData.get("companyAddress") ?? "").trim() || null;

  if (!roomId || !fullName || !phone || checkOut <= checkIn) {
    redirect("/panel/rezervasyonlar?hata=eksik");
  }
  if (!handledByEmployeeId) {
    redirect("/panel/rezervasyonlar?hata=personel-eksik");
  }

  // Ayni odada tarih cakismasi var mi? (hem kendi rezervasyonlarimiz hem Booking.com/Airbnb'den senkronize olanlar)
  const [clash, externalClash] = await Promise.all([
    prisma.reservation.findFirst({
      where: {
        roomId,
        status: { in: ["OPSIYON", "ONAYLI", "GIRIS_YAPTI"] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    }),
    prisma.externalBooking.findFirst({
      where: { roomId, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
    }),
  ]);
  if (clash) redirect("/panel/rezervasyonlar?hata=cakisma");
  if (externalClash) redirect("/panel/rezervasyonlar?hata=cakisma-harici");

  // Ayni telefonla daha once kayit acilmissa musteriyi tekillestir, yeni kayit acmak yerine
  // mevcut kaydini guncelleyip kullan. Telefon farkli formatlarda kayitli olabilecegi icin
  // (eski kay\u0131tlar, farkli yazimlar) normalize edilmis haliyle karsilastiriyoruz.
  const { normalizePhone } = await import("@/lib/whatsapp");
  const normalizedPhone = normalizePhone(phone);
  const allGuestPhones = await prisma.guest.findMany({ select: { id: true, phone: true } });
  const existingGuestId = allGuestPhones.find((g) => normalizePhone(g.phone) === normalizedPhone)?.id;
  const existingGuest = existingGuestId ? await prisma.guest.findUnique({ where: { id: existingGuestId } }) : null;

  const guestData = {
    fullName,
    ...(idType ? { idType } : {}),
    ...(idNumber ? { idNumber } : {}),
    ...(birthDateRaw ? { birthDate: new Date(birthDateRaw) } : {}),
    ...(nationality ? { nationality } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
  };

  const guest = existingGuest
    ? await prisma.guest.update({ where: { id: existingGuest.id }, data: guestData })
    : await prisma.guest.create({
        data: { phone, portalCode: generatePortalCode(), ...guestData },
      });

  const count = await prisma.reservation.count();

  const reservation = await prisma.reservation.create({
    data: {
      code: `RZ-${String(1000 + count + 1)}`,
      roomId,
      guestId: guest.id,
      checkIn,
      checkOut,
      stayType,
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
      deposit: Number.isFinite(deposit) ? deposit : 0,
      handledByEmployeeId,
      notes,
      billToCompany,
      companyName,
      companyTaxNo,
      companyTaxOffice,
      companyAddress,
    },
    include: { room: true },
  });

  await logActivity(
    "Rezervasyon oluşturdu",
    `${reservation.code} · ${guest.fullName} · Oda ${reservation.room.number} · ${fmtDate(checkIn)} → ${fmtDate(checkOut)}`,
    reservation.id
  );

  // Formda "+ Bir kişi daha ekle" ile eklenen ek misafirler varsa, ayni anda kaydet.
  // Her alan turu ayni "name" ile tekrarlandigi icin, satirlar DOM sirasiyla eslesir.
  const egNames = formData.getAll("eg_name") as string[];
  const egIdTypes = formData.getAll("eg_idType") as string[];
  const egIdNumbers = formData.getAll("eg_idNumber") as string[];
  const egBirthDates = formData.getAll("eg_birthDate") as string[];
  const egNationalities = formData.getAll("eg_nationality") as string[];
  const egPhones = formData.getAll("eg_phone") as string[];
  const egFees = formData.getAll("eg_fee") as string[];

  let extraGuestFeeTotal = 0;
  for (let i = 0; i < egNames.length; i++) {
    const egName = (egNames[i] ?? "").trim();
    if (!egName) continue;
    const egFee = Number(egFees[i] ?? 0);
    const validFee = Number.isFinite(egFee) && egFee > 0 ? egFee : 0;
    extraGuestFeeTotal += validFee;

    await prisma.extraGuest.create({
      data: {
        reservationId: reservation.id,
        fullName: egName,
        idType: egIdTypes[i] || "TC",
        idNumber: (egIdNumbers[i] ?? "").trim() || null,
        birthDate: egBirthDates[i] ? new Date(egBirthDates[i]) : null,
        nationality: (egNationalities[i] ?? "").trim() || "T.C.",
        phone: (egPhones[i] ?? "").trim() || null,
        fee: validFee,
      },
    });
  }

  if (extraGuestFeeTotal > 0) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { totalAmount: { increment: extraGuestFeeTotal } },
    });
  }
  if (egNames.filter((n) => n.trim()).length > 0) {
    await logActivity(
      "Rezervasyonla birlikte ek misafir ekledi",
      `${reservation.code} · ${egNames.filter((n) => n.trim()).length} kişi`,
      reservation.id
    );
  }

  // Rezervasyon onay bildirimi - musterinin e-posta/telefonu varsa ve kanal(lar) acik ise gonderilir.
  // Basarisiz olsa bile rezervasyon islemini asla bozmaz.
  try {
    const { getIntegrationSettings } = await import("@/lib/iyzico");
    const { sendEmail } = await import("@/lib/email");
    const { sendSms } = await import("@/lib/sms");
    const { normalizePhone } = await import("@/lib/whatsapp");
    const settings = await getIntegrationSettings();

    const confirmText = `Sayın ${guest.fullName}, Onay Apart Rezidans'ta ${reservation.room.number} numaralı dairede ${fmtDate(checkIn)} - ${fmtDate(checkOut)} tarihleri arasında rezervasyonunuz onaylanmıştır. Sözleşme no: ${reservation.code}.`;

    if (guest.email) {
      await sendEmail(
        { emailEnabled: settings.emailEnabled, emailApiKey: settings.emailApiKey, emailFrom: settings.emailFrom },
        guest.email,
        "Onay Apart — Rezervasyonunuz Onaylandı",
        confirmText.replace(/\n/g, "<br>")
      );
    }
    if (guest.phone) {
      await sendSms(
        { smsEnabled: settings.smsEnabled, smsUserCode: settings.smsUserCode, smsPassword: settings.smsPassword, smsHeader: settings.smsHeader },
        normalizePhone(guest.phone),
        confirmText
      );
    }
  } catch {
    // bildirim gonderimi basarisiz olsa da rezervasyon kaydi tamamlanmis sayilir
  }

  revalidatePath("/panel");
  revalidatePath("/", "layout");
  redirect("/panel/rezervasyonlar?ok=1");
}

export async function setReservationStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));

  const existing = await prisma.reservation.findUnique({ where: { id }, select: { status: true, roomId: true } });
  const before = await prisma.reservation.update({ where: { id }, data: { status }, include: { guest: true, room: true } });
  await logActivity(
    "Rezervasyon durumunu değiştirdi",
    `${before.code} · ${before.guest.fullName} · yeni durum: ${status}`,
    before.id
  );

  // Cikis (TAMAMLANDI) yapildiginda: oda otomatik "Temizlikte" olur ve kat hizmetleri
  // icin bir temizlik gorevi acilir. Sadece gercek bir gecis oldugunda (daha once
  // TAMAMLANDI degilken simdi oldu) tetiklenir - tekrar tikla(n)inca kopya gorev acilmaz.
  if (status === "TAMAMLANDI" && existing?.status !== "TAMAMLANDI") {
    await prisma.$transaction([
      prisma.room.update({ where: { id: before.roomId }, data: { condition: "TEMIZLIK" } }),
      prisma.task.create({
        data: {
          roomId: before.roomId,
          guestId: before.guestId,
          kind: "TEMIZLIK",
          title: `Oda ${before.room.number} — çıkış sonrası temizlik`,
          message: `${before.guest.fullName} çıkış yaptı (${before.code}). Oda müsaitliğe alınmadan önce temizlenmeli.`,
        },
      }),
    ]);
    await logActivity("Otomatik temizlik görevi açtı", `Oda ${before.room.number} · ${before.code}`, before.id);
  }

  revalidatePath("/panel");
  revalidatePath("/panel/bakim-talepleri");
  revalidatePath("/", "layout");
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
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return { ok: false, error: "Rezervasyon bulunamadı." };

  const durationMs = reservation.checkOut.getTime() - reservation.checkIn.getTime();
  const newCheckIn = new Date(newCheckInISO);
  const newCheckOut = new Date(newCheckIn.getTime() + durationMs);

  const [clash, externalClash] = await Promise.all([
    prisma.reservation.findFirst({
      where: {
        id: { not: reservationId },
        roomId: newRoomId,
        status: { in: ["OPSIYON", "ONAYLI", "GIRIS_YAPTI"] },
        checkIn: { lt: newCheckOut },
        checkOut: { gt: newCheckIn },
      },
    }),
    prisma.externalBooking.findFirst({
      where: { roomId: newRoomId, checkIn: { lt: newCheckOut }, checkOut: { gt: newCheckIn } },
    }),
  ]);
  if (clash) return { ok: false, error: "Seçilen tarihte bu odada başka bir rezervasyon var." };
  if (externalClash) return { ok: false, error: "Seçilen tarihte bu oda Booking.com/Airbnb üzerinden dolu görünüyor." };

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

  revalidatePath("/panel");
  revalidatePath("/", "layout");

  return { ok: true };
}

export async function toggleKbs(formData: FormData) {
  const id = String(formData.get("id"));
  const value = formData.get("value") === "true";
  await prisma.reservation.update({ where: { id }, data: { kbsReported: value } });
  revalidatePath("/panel");
}

export async function addPayment(formData: FormData) {
  const reservationId = String(formData.get("reservationId"));
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "NAKIT");
  const accountId = String(formData.get("accountId") ?? "") || null;
  const invoiceRequested = formData.get("invoiceRequested") === "on";
  const invoiceAmountRaw = Number(formData.get("invoiceAmount") ?? 0);

  if (amount > 0) {
    const payment = await prisma.payment.create({
      data: { reservationId, amount, method, accountId },
      include: { reservation: true },
    });
    await logActivity("Tahsilat girdi", `${payment.reservation.code} · ${fmtMoney(amount)} · ${method}`, reservationId);

    // Nakit odemede "fatura kesilsin mi?" sorusuna evet denip tutar girildiyse,
    // otomatik olarak fatura bekleme listesine (Faturalar sayfasi) eklenir. Tutar
    // odemenin tamami olmak zorunda degil - musteri sadece bir kismi icin isteyebilir.
    if (invoiceRequested) {
      const invoiceAmount = invoiceAmountRaw > 0 && invoiceAmountRaw <= amount ? invoiceAmountRaw : amount;
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
  }
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/panel/muhasebe");
  revalidatePath("/panel/muhasebe/faturalar");
  revalidatePath("/panel");
}

export async function handleLead(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.lead.update({ where: { id }, data: { handled: true } });
  revalidatePath("/panel/talepler");
  revalidatePath("/panel");
}

/* ---------------------------------------------------------------- */
/* Oda tipleri (1+0, 1+1, 2+1 ...) — panelden serbestce eklenip      */
/* silinebilir. Yeni tip olusturulunca 4 konaklama suresi icin       */
/* fiyat satiri otomatik acilir (0 = "fiyat icin arayin").           */
/* ---------------------------------------------------------------- */

const DEFAULT_RATES = [
  { stayType: "GUNLUK", label: "Günlük", sort: 1 },
  { stayType: "HAFTALIK", label: "Haftalık", sort: 2 },
  { stayType: "AYLIK", label: "Aylık", sort: 3 },
  { stayType: "DONEMLIK", label: "Öğrenci dönemlik", sort: 4 },
  { stayType: "YILLIK", label: "Yıllık", sort: 5 },
];

function readTypeFields(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    seoTitle: String(formData.get("seoTitle") ?? "").trim(),
    seoText: String(formData.get("seoText") ?? "").trim(),
    minM2: Number(formData.get("minM2") ?? 0) || 0,
    maxM2: Number(formData.get("maxM2") ?? 0) || 0,
    capacity: String(formData.get("capacity") ?? "").trim(),
    features: String(formData.get("features") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
  };
}

export async function createRoomType(formData: FormData) {
  const data = readTypeFields(formData);
  if (!data.code || !data.slug || !data.name) {
    redirect("/panel/tipler?hata=eksik");
  }

  let typeId: string;
  try {
    const count = await prisma.roomType.count();
    const type = await prisma.roomType.create({ data: { ...data, sort: count + 1 } });
    typeId = type.id;
    await prisma.rate.createMany({
      data: DEFAULT_RATES.map((r) => ({ ...r, typeId: type.id, price: 0 })),
    });
  } catch {
    redirect("/panel/tipler?hata=cakisma");
  }

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("RoomType", typeId, formData, ["name", "tagline", "description", "capacity", "features"]);

  revalidateSite();
  redirect("/panel/tipler?ok=eklendi");
}

export async function updateRoomType(formData: FormData) {
  const id = String(formData.get("id"));
  const data = readTypeFields(formData);
  if (!data.code || !data.slug || !data.name) {
    redirect("/panel/tipler?hata=eksik");
  }

  try {
    await prisma.roomType.update({ where: { id }, data });
  } catch {
    redirect("/panel/tipler?hata=cakisma");
  }

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("RoomType", id, formData, ["name", "tagline", "description", "capacity", "features"]);

  revalidateSite();
  redirect("/panel/tipler?ok=guncellendi");
}

export async function deleteRoomType(formData: FormData) {
  const id = String(formData.get("id"));
  const roomCount = await prisma.room.count({ where: { typeId: id } });

  if (roomCount > 0) {
    redirect("/panel/tipler?hata=dolu");
  }

  await prisma.roomType.delete({ where: { id } });
  revalidateSite();
  redirect("/panel/tipler?ok=silindi");
}

/* ---------------------------------------------------------------- */
/* Daireler — panelden ekle / duzenle / sil.                         */
/* ---------------------------------------------------------------- */

function readRoomFields(formData: FormData) {
  return {
    number: Number(formData.get("number") ?? 0),
    floor: Number(formData.get("floor") ?? 0) || 0,
    m2: Number(formData.get("m2") ?? 0) || 0,
    beds: String(formData.get("beds") ?? "").trim(),
    view: String(formData.get("view") ?? "").trim(),
    typeId: String(formData.get("typeId") ?? ""),
    condition: String(formData.get("condition") ?? "MUSAIT"),
    isPublished: formData.get("isPublished") === "on" || formData.get("isPublished") === "true",
  };
}

/** Bir dairenin su anki olanak listesini cozer - alan bossa (hic ozellestirilmemisse)
 *  tum mevcut olanaklar secili sayilir, site tarafindaki varsayilan davranisla ayni. */
async function resolveRoomAmenities(roomId: string): Promise<string[]> {
  const [room, allAmenities] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId }, select: { amenities: true } }),
    prisma.amenity.findMany({ select: { icon: true } }),
  ]);
  const allIcons = allAmenities.map((a) => a.icon);
  return room?.amenities ? room.amenities.split(",").filter(Boolean) : allIcons;
}

/** Bu odaya, mevcut (genel) olanak listesinden bir tanesini ekler. */
export async function assignRoomAmenity(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const icon = String(formData.get("icon") ?? "");
  if (!icon) redirect(`/panel/odalar/${roomNumber}`);

  const current = await resolveRoomAmenities(roomId);
  const next = Array.from(new Set([...current, icon]));
  await prisma.room.update({ where: { id: roomId }, data: { amenities: next.join(",") } });

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=guncellendi`);
}

/** Bu odadan bir olanagi kaldirir (genel listeden silmez, sadece bu odada gorunmez). */
export async function removeRoomAmenity(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const icon = String(formData.get("icon") ?? "");

  const current = await resolveRoomAmenities(roomId);
  const next = current.filter((i) => i !== icon);
  await prisma.room.update({ where: { id: roomId }, data: { amenities: next.join(",") } });

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=guncellendi`);
}

/** Hic var olmayan, yepyeni bir olanak yaratip dogrudan bu odaya ekler.
 *  Genel katalogda da olusur, boylece baska odalarda da secilebilir hale gelir. */
export async function createAndAssignAmenity(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const label = String(formData.get("label") ?? "").trim();
  if (!label) redirect(`/panel/odalar/${roomNumber}?hata=olanak-eksik`);

  const icon =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `olanak-${Date.now()}`;

  const count = await prisma.amenity.count();
  try {
    await prisma.amenity.create({ data: { icon, label, sort: count + 1 } });
  } catch {
    redirect(`/panel/odalar/${roomNumber}?hata=olanak-cakisma`);
  }

  const current = await resolveRoomAmenities(roomId);
  const next = Array.from(new Set([...current, icon]));
  await prisma.room.update({ where: { id: roomId }, data: { amenities: next.join(",") } });

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=guncellendi`);
}

/**
 * Musteri telefonda "odayi gormek istiyorum" derse, personel telefon numarasini
 * girip tek tikla o odanin genel sayfasini WhatsApp'tan gonderir. WhatsApp API
 * acikca yapilandirilmissa dogrudan gonderir; degilse hazir mesajla WhatsApp'i
 * acar, personel sadece "Gonder"e basar.
 */
export async function sendRoomInfoWhatsapp(formData: FormData) {
  const phone = String(formData.get("phone") ?? "").trim();
  const roomId = String(formData.get("roomId") ?? "");
  const back = String(formData.get("back") ?? "");

  const room = await prisma.room.findUnique({ where: { id: roomId }, include: { type: true } });
  if (!room) redirect("/panel/odalar?hata=oda-bulunamadi");

  const returnPath = back || `/panel/odalar/${room!.number}`;

  if (!phone) redirect(`${returnPath}?hata=telefon-eksik`);

  const link = `${site.url}/odalar/${room!.type.slug}/oda-${room!.number}`;
  const body = `Merhaba! İlgilendiğiniz daireyi buradan inceleyebilirsiniz: ${link}\n\nOda ${room!.number} · ${room!.type.name} · Onay Apart Rezidans`;

  const { sendWhatsappMessage } = await import("@/lib/whatsapp");
  const result = await sendWhatsappMessage(phone, body);

  await prisma.messageLog.create({
    data: { phone, body, kind: "ODA_BILGISI", status: result.status, errorMessage: result.errorMessage ?? null },
  });

  await logActivity("Oda bilgisini WhatsApp'tan gönderdi", `Oda ${room!.number} · ${phone}`);
  revalidatePath(`/panel/odalar/${room!.number}`);
  revalidatePath("/panel/odalar");

  if (result.status === "LINK_HAZIRLANDI" && result.link) {
    redirect(result.link);
  }
  redirect(`${returnPath}?ok=${result.status === "GONDERILDI" ? "wa-gonderildi" : "wa-hata"}`);
}

export async function createRoom(formData: FormData) {
  const data = readRoomFields(formData);
  if (!data.number || !data.typeId) {
    redirect("/panel/odalar?hata=eksik");
  }

  let roomId: string;
  try {
    const room = await prisma.room.create({ data });
    roomId = room.id;
  } catch {
    redirect("/panel/odalar?hata=cakisma");
  }

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Room", roomId, formData, ["beds", "view"]);

  revalidateSite();
  redirect("/panel/odalar?ok=eklendi");
}

export async function updateRoom(formData: FormData) {
  const id = String(formData.get("id"));
  const oldNumber = String(formData.get("oldNumber"));
  const data = readRoomFields(formData);

  try {
    await prisma.room.update({ where: { id }, data });
  } catch {
    redirect(`/panel/odalar/${oldNumber}?hata=cakisma`);
  }

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Room", id, formData, ["beds", "view"]);

  await logActivity("Daire bilgilerini güncelledi", `Oda ${data.number}`);
  revalidateSite();
  redirect(`/panel/odalar/${data.number}?ok=guncellendi`);
}

export async function deleteRoom(formData: FormData) {
  const id = String(formData.get("id"));
  const reservationCount = await prisma.reservation.count({ where: { roomId: id } });
  const number = String(formData.get("number"));

  if (reservationCount > 0) {
    redirect(`/panel/odalar/${number}?hata=gecmis`);
  }

  await prisma.room.delete({ where: { id } });
  await logActivity("Daire sildi", `Oda ${number}`);
  revalidateSite();
  redirect("/panel/odalar?ok=silindi");
}

/* ---------------------------------------------------------------- */
/* Fotograflar — dosya yukleme veya gorsel adresi yapistirma.        */
/* NOT: yerel dosya yukleme kalici disk gerektirir (VPS / kendi      */
/* sunucun). Vercel gibi sunucusuz barindirmada dosyalar kalici      */
/* olmaz; o durumda "gorsel adresi" alanini kullanin ya da            */
/* Vercel Blob / Cloudflare R2 gibi bir depoya gecirilir.            */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Demirbaslar - odaya bagli, sozlesmeye otomatik yansir.             */
/* ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- */
/* Booking.com / Airbnb takvim senkronizasyonu (iCal).                */
/* ---------------------------------------------------------------- */

export async function createExternalCalendar(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const platform = String(formData.get("platform") ?? "DIGER");
  const importUrl = String(formData.get("importUrl") ?? "").trim();

  if (!importUrl) redirect(`/panel/odalar/${roomNumber}?hata=takvim-eksik`);

  const cal = await prisma.externalCalendar.create({ data: { roomId, platform, importUrl } });

  // Ekler eklenmez ilk senkronu hemen dene, kullanici beklemeden veri gorsun.
  const { syncExternalCalendar } = await import("@/lib/calendarSync");
  await syncExternalCalendar(cal.id);

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=takvim`);
}

export async function deleteExternalCalendar(formData: FormData) {
  const id = String(formData.get("id"));
  const roomNumber = String(formData.get("roomNumber"));
  await prisma.externalCalendar.delete({ where: { id } });
  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=takvim`);
}

export async function syncExternalCalendarNow(formData: FormData) {
  const id = String(formData.get("id"));
  const roomNumber = String(formData.get("roomNumber"));
  const { syncExternalCalendar } = await import("@/lib/calendarSync");
  const result = await syncExternalCalendar(id);
  revalidateSite();
  if (!result.ok) redirect(`/panel/odalar/${roomNumber}?hata=takvim-senkron`);
  redirect(`/panel/odalar/${roomNumber}?ok=takvim-senkron`);
}

/** Tum odalardaki tum harici takvimleri tek seferde senkronize eder. */
export async function syncAllCalendars() {
  const { syncAllExternalCalendars } = await import("@/lib/calendarSync");
  const result = await syncAllExternalCalendars();
  revalidateSite();
  redirect(`/panel/odalar?ok=takvim-toplu&basarili=${result.ok}&toplam=${result.total}`);
}

export async function createAsset(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) redirect(`/panel/odalar/${roomNumber}?hata=demirbas-eksik`);

  await prisma.asset.create({
    data: { roomId, name, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1, note },
  });

  redirect(`/panel/odalar/${roomNumber}?ok=demirbas`);
}

export async function updateAsset(formData: FormData) {
  const id = String(formData.get("id"));
  const roomNumber = String(formData.get("roomNumber"));
  const name = String(formData.get("name") ?? "").trim();
  const quantity = Number(formData.get("quantity") ?? 1);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) redirect(`/panel/odalar/${roomNumber}?hata=demirbas-eksik`);

  await prisma.asset.update({
    where: { id },
    data: { name, quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1, note },
  });

  redirect(`/panel/odalar/${roomNumber}?ok=demirbas`);
}

export async function deleteAsset(formData: FormData) {
  const id = String(formData.get("id"));
  const roomNumber = String(formData.get("roomNumber"));
  await prisma.asset.delete({ where: { id } });
  redirect(`/panel/odalar/${roomNumber}?ok=demirbas`);
}

export async function addPhoto(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const roomNumber = String(formData.get("roomNumber"));
  const alt = String(formData.get("alt") ?? "").trim();
  const externalUrl = String(formData.get("url") ?? "").trim();
  const file = formData.get("file") as File | null;

  let url = "";

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const filename = `${roomNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "odalar");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    url = `/odalar/${filename}`;
  } else if (externalUrl) {
    url = externalUrl;
  } else {
    redirect(`/panel/odalar/${roomNumber}?hata=foto`);
  }

  const sort = await prisma.photo.count({ where: { roomId } });
  await prisma.photo.create({
    data: { roomId, url, alt: alt || `Erzurum apart daire ${roomNumber} fotoğrafı`, sort },
  });

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=foto`);
}

export async function deletePhoto(formData: FormData) {
  const id = String(formData.get("id"));
  const roomNumber = String(formData.get("roomNumber"));
  const url = String(formData.get("url") ?? "");

  await prisma.photo.delete({ where: { id } });

  if (url.startsWith("/odalar/")) {
    try {
      await unlink(path.join(process.cwd(), "public", url));
    } catch {
      // dosya zaten yoksa yoksay
    }
  }

  revalidateSite();
  redirect(`/panel/odalar/${roomNumber}?ok=foto`);
}

/* ---------------------------------------------------------------- */
/* Site icerigi: iletisim bilgileri, ana sayfa metni, olanaklar,     */
/* ve site geneli SSS. Hepsi panelden duzenlenir.                    */
/* ---------------------------------------------------------------- */

export async function updateSiteSettings(formData: FormData) {
  const data = {
    phoneDisplay: String(formData.get("phoneDisplay") ?? "").trim(),
    phoneHref: String(formData.get("phoneHref") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    addressStreet: String(formData.get("addressStreet") ?? "").trim(),
    addressDistrict: String(formData.get("addressDistrict") ?? "").trim(),
    addressCity: String(formData.get("addressCity") ?? "").trim(),
    addressPostalCode: String(formData.get("addressPostalCode") ?? "").trim(),
    heroEyebrow: String(formData.get("heroEyebrow") ?? "").trim(),
    heroTitle: String(formData.get("heroTitle") ?? "").trim(),
    heroIntro: String(formData.get("heroIntro") ?? "").trim(),
    heroImageUrl: String(formData.get("heroImageUrl") ?? "").trim() || null,
  };

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("SiteSetting", "main", formData, ["heroEyebrow", "heroTitle", "heroIntro"]);

  revalidateSite();
  redirect("/panel/icerik?ok=iletisim");
}

/** Bu sitede hangi dillerin acik olacagini gunceller. */
export async function updateEnabledLocales(formData: FormData) {
  const { locales } = await import("@/lib/i18n/config");
  const selected = locales.filter((l) => formData.get(`locale_${l}`) === "on");
  const enabledLocales = selected.length > 0 ? selected.join(",") : "en";

  await prisma.siteSetting.upsert({
    where: { id: "main" },
    update: { enabledLocales },
    create: {
      id: "main",
      phoneDisplay: "",
      phoneHref: "",
      whatsapp: "",
      addressStreet: "",
      addressDistrict: "",
      addressCity: "",
      addressPostalCode: "",
      heroEyebrow: "",
      heroTitle: "",
      heroIntro: "",
      enabledLocales,
    },
  });

  await logActivity("Site dillerini güncelledi", enabledLocales);
  revalidateSite();
  redirect("/panel/icerik?ok=diller");
}

export async function createAmenity(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) redirect("/panel/icerik?hata=olanak-eksik");

  const icon =
    label
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `olanak-${Date.now()}`;

  const count = await prisma.amenity.count();
  let amenity;
  try {
    amenity = await prisma.amenity.create({ data: { icon, label, sort: count + 1 } });
  } catch {
    redirect("/panel/icerik?hata=olanak-cakisma");
  }

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Amenity", amenity.id, formData, ["label"]);

  revalidateSite();
  redirect("/panel/icerik?ok=olanak-eklendi");
}

export async function updateAmenity(formData: FormData) {
  const id = String(formData.get("id"));
  const label = String(formData.get("label") ?? "").trim();
  if (!label) redirect("/panel/icerik?hata=olanak-eksik");

  await prisma.amenity.update({ where: { id }, data: { label } });

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Amenity", id, formData, ["label"]);

  revalidateSite();
  redirect("/panel/icerik?ok=olanak-guncellendi");
}

export async function deleteAmenity(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.amenity.delete({ where: { id } });
  revalidateSite();
  redirect("/panel/icerik?ok=olanak-silindi");
}

export async function createFaq(formData: FormData) {
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const homepage = formData.get("homepage") === "on";
  if (!question || !answer) redirect("/panel/icerik?hata=sss-eksik");

  const count = await prisma.faq.count();
  const faq = await prisma.faq.create({ data: { question, answer, homepage, sort: count + 1 } });

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Faq", faq.id, formData, ["question", "answer"]);

  revalidateSite();
  redirect("/panel/icerik?ok=sss-eklendi");
}

export async function updateFaq(formData: FormData) {
  const id = String(formData.get("id"));
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const homepage = formData.get("homepage") === "on";
  if (!question || !answer) redirect("/panel/icerik?hata=sss-eksik");

  await prisma.faq.update({ where: { id }, data: { question, answer, homepage } });

  const { saveTranslationsFromForm } = await import("@/lib/translations");
  await saveTranslationsFromForm("Faq", id, formData, ["question", "answer"]);

  revalidateSite();
  redirect("/panel/icerik?ok=sss-guncellendi");
}

export async function deleteFaq(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.faq.delete({ where: { id } });
  revalidateSite();
  redirect("/panel/icerik?ok=sss-silindi");
}

/* ---------------------------------------------------------------- */
/* Musteri yorumlari - personelin Google'dan elle sectigi, kopyaladigi  */
/* gercek yorumlar. API yok, kasitli - hicbir zaman bozulmaz.          */
/* ---------------------------------------------------------------- */

export async function createTestimonial(formData: FormData) {
  const authorName = String(formData.get("authorName") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5) || 5));
  if (!authorName || !text) redirect("/panel/icerik?hata=yorum-eksik");

  const count = await prisma.testimonial.count();
  await prisma.testimonial.create({ data: { authorName, text, rating, sort: count + 1 } });

  await logActivity("Müşteri yorumu ekledi", authorName);
  revalidateSite();
  redirect("/panel/icerik?ok=yorum-eklendi");
}

export async function updateTestimonial(formData: FormData) {
  const id = String(formData.get("id"));
  const authorName = String(formData.get("authorName") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5) || 5));
  const isPublished = formData.get("isPublished") === "on";
  if (!authorName || !text) redirect("/panel/icerik?hata=yorum-eksik");

  await prisma.testimonial.update({ where: { id }, data: { authorName, text, rating, isPublished } });
  revalidateSite();
  redirect("/panel/icerik?ok=yorum-guncellendi");
}

export async function deleteTestimonial(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.testimonial.delete({ where: { id } });
  revalidateSite();
  redirect("/panel/icerik?ok=yorum-silindi");
}

/* ---------------------------------------------------------------- */
/* Bakim / ariza talepleri (Task) - hem panelden hem musteri         */
/* panelinden acilabilir, admin tamamlandi olarak kapatir.           */
/* ---------------------------------------------------------------- */

export async function createTask(formData: FormData) {
  const roomId = String(formData.get("roomId"));
  const kind = String(formData.get("kind") ?? "ARIZA");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!roomId || !title) redirect("/panel/bakim-talepleri?hata=eksik");

  await prisma.task.create({ data: { roomId, kind, title, message: message || null } });
  revalidatePath("/panel");
  revalidatePath("/panel/bakim-talepleri");
  redirect("/panel/bakim-talepleri?ok=eklendi");
}

export async function closeTask(formData: FormData) {
  const id = String(formData.get("id"));
  const back = String(formData.get("back") ?? "/panel");
  const note = String(formData.get("note") ?? "").trim();

  const { getCurrentActorLabel } = await import("@/lib/activityLog");
  const authorLabel = await getCurrentActorLabel();

  const task = await prisma.task.findUnique({ where: { id }, include: { room: true } });

  await prisma.$transaction([
    prisma.task.update({ where: { id }, data: { status: "TAMAMLANDI", closedAt: new Date() } }),
    ...(note
      ? [prisma.taskNote.create({ data: { taskId: id, note, kind: "TAMAMLANDI", authorLabel } })]
      : []),
    // Temizlik gorevi tamamlandiginda oda otomatik olarak musaitlige doner.
    ...(task?.kind === "TEMIZLIK" ? [prisma.room.update({ where: { id: task.roomId }, data: { condition: "MUSAIT" } })] : []),
  ]);

  await logActivity(
    task?.kind === "TEMIZLIK" ? "Temizliği tamamladı, oda müsaitliğe alındı" : "Bakım talebini tamamladı",
    note || (task ? `Oda ${task.room.number}` : undefined)
  );
  revalidatePath("/panel");
  revalidatePath("/panel/bakim-talepleri");
  revalidatePath("/", "layout");
  redirect(back);
}

/** Bir goreve, acikken ya da kapaliyken, kalici bir ilerleme notu ekler. Asla silinmez. */
export async function addTaskNote(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const back = String(formData.get("back") ?? "/panel/bakim-talepleri");
  const note = String(formData.get("note") ?? "").trim();
  if (!note) redirect(`${back}?hata=not-eksik`);

  const { getCurrentActorLabel } = await import("@/lib/activityLog");
  const authorLabel = await getCurrentActorLabel();

  await prisma.taskNote.create({ data: { taskId, note, kind: "ILERLEME", authorLabel } });

  revalidatePath("/panel");
  revalidatePath("/panel/bakim-talepleri");
  redirect(`${back}?ok=not-eklendi`);
}

export async function reopenTask(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.task.update({ where: { id }, data: { status: "ACIK", closedAt: null } });
  revalidatePath("/panel");
  revalidatePath("/panel/bakim-talepleri");
  redirect("/panel/bakim-talepleri?ok=yeniden-acildi");
}

/* ---------------------------------------------------------------- */
/* Musteriler - kimlik bilgilerini duzenleme ve panel giris kodu.    */
/* ---------------------------------------------------------------- */

export async function updateGuest(formData: FormData) {
  const id = String(formData.get("id"));
  const data = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || null,
    idType: String(formData.get("idType") ?? "TC"),
    idNumber: String(formData.get("idNumber") ?? "").trim() || null,
    birthDate: (() => {
      const v = String(formData.get("birthDate") ?? "").trim();
      return v ? new Date(v) : null;
    })(),
    nationality: String(formData.get("nationality") ?? "TR").trim() || "TR",
    address: String(formData.get("address") ?? "").trim() || null,
    wifiNetwork: String(formData.get("wifiNetwork") ?? "").trim() || null,
    wifiPassword: String(formData.get("wifiPassword") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  };

  if (!data.fullName || !data.phone) redirect(`/panel/musteriler/${id}?hata=eksik`);

  await prisma.guest.update({ where: { id }, data });
  redirect(`/panel/musteriler/${id}?ok=1`);
}

/* ---------------------------------------------------------------- */
/* Ek misafirler - kiraciyla birlikte kalan, ekstra ucretli ziyaretci.  */
/* ---------------------------------------------------------------- */

export async function createExtraGuest(formData: FormData) {
  const reservationId = String(formData.get("reservationId"));
  const guestId = String(formData.get("guestId"));
  const fullName = String(formData.get("fullName") ?? "").trim();
  const idType = String(formData.get("idType") ?? "TC");
  const idNumber = String(formData.get("idNumber") ?? "").trim() || null;
  const birthDateRaw = String(formData.get("birthDate") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "T.C.").trim() || "T.C.";
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const fee = Number(formData.get("fee") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!fullName) redirect(`/panel/musteriler/${guestId}?hata=misafir-eksik`);

  const validFee = Number.isFinite(fee) && fee > 0 ? fee : 0;

  await prisma.$transaction([
    prisma.extraGuest.create({
      data: {
        reservationId,
        fullName,
        idType,
        idNumber,
        birthDate: birthDateRaw ? new Date(birthDateRaw) : null,
        nationality,
        phone,
        fee: validFee,
        note,
      },
    }),
    ...(validFee > 0
      ? [prisma.reservation.update({ where: { id: reservationId }, data: { totalAmount: { increment: validFee } } })]
      : []),
  ]);

  await logActivity(
    "Ek misafir ekledi",
    `${fullName}${validFee > 0 ? ` · ${fmtMoney(validFee)} ek ücret` : ""}`,
    reservationId
  );
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/panel");
  redirect(`/panel/musteriler/${guestId}?ok=misafir-eklendi`);
}

export async function deleteExtraGuest(formData: FormData) {
  const id = String(formData.get("id"));
  const guestId = String(formData.get("guestId"));
  const reservationId = String(formData.get("reservationId"));

  const extra = await prisma.extraGuest.delete({ where: { id } });

  if (extra.fee > 0) {
    await prisma.reservation.update({ where: { id: reservationId }, data: { totalAmount: { decrement: extra.fee } } });
  }

  await logActivity("Ek misafir sildi", extra.fullName, reservationId);
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/panel");
  redirect(`/panel/musteriler/${guestId}?ok=misafir-silindi`);
}

/* ---------------------------------------------------------------- */
/* Oda servisi - restorandan odaya giden yemek/icecek hesabi.         */
/* ---------------------------------------------------------------- */

export async function addRoomServiceCharge(formData: FormData) {
  const reservationId = String(formData.get("reservationId"));
  const guestId = String(formData.get("guestId"));
  const menuItemId = String(formData.get("menuItemId") ?? "") || null;
  const customName = String(formData.get("customName") ?? "").trim();
  const customPrice = Number(formData.get("customPrice") ?? 0);
  const quantity = Math.max(1, Number(formData.get("quantity") ?? 1) || 1);
  const note = String(formData.get("note") ?? "").trim() || null;

  let name = customName;
  let unitPrice = Number.isFinite(customPrice) ? customPrice : 0;

  if (menuItemId) {
    const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (item) {
      name = item.name;
      unitPrice = item.price;
    }
  }

  if (!name || unitPrice <= 0) redirect(`/panel/musteriler/${guestId}?hata=servis-eksik`);

  const amount = unitPrice * quantity;

  await prisma.$transaction([
    prisma.roomServiceCharge.create({
      data: { reservationId, menuItemId, name, unitPrice, quantity, amount, note, status: "ONAYLANDI", source: "PERSONEL" },
    }),
    prisma.reservation.update({ where: { id: reservationId }, data: { totalAmount: { increment: amount } } }),
  ]);

  await logActivity("Oda servisi hesabına ekledi", `${name} x${quantity} · ${fmtMoney(amount)}`, reservationId);
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/panel/muhasebe");
  redirect(`/panel/musteriler/${guestId}?ok=servis-eklendi`);
}

export async function deleteRoomServiceCharge(formData: FormData) {
  const id = String(formData.get("id"));
  const guestId = String(formData.get("guestId"));
  const reservationId = String(formData.get("reservationId"));

  const charge = await prisma.roomServiceCharge.delete({ where: { id } });

  // Sadece daha once onaylanip (dolayisiyla tutara islenmis) bir kayitsa geri dusuruyoruz.
  // Bekleyen ya da reddedilmis bir siparis zaten hic islenmemisti.
  if (charge.status === "ONAYLANDI") {
    await prisma.reservation.update({ where: { id: reservationId }, data: { totalAmount: { decrement: charge.amount } } });
  }

  await logActivity("Oda servisi kaydını sildi", charge.name, reservationId);
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel/rezervasyonlar");
  redirect(`/panel/musteriler/${guestId}?ok=servis-silindi`);
}

/** Misafirin kendi panelinden verdigi bekleyen siparisi onaylar - o an rezervasyon tutarina islenir. */
export async function approveRoomServiceCharge(formData: FormData) {
  const id = String(formData.get("id"));
  const guestId = String(formData.get("guestId"));
  const reservationId = String(formData.get("reservationId"));

  const charge = await prisma.roomServiceCharge.findUnique({ where: { id } });
  if (!charge || charge.status !== "BEKLIYOR") redirect(`/panel/musteriler/${guestId}`);

  await prisma.$transaction([
    prisma.roomServiceCharge.update({ where: { id }, data: { status: "ONAYLANDI" } }),
    prisma.reservation.update({ where: { id: reservationId }, data: { totalAmount: { increment: charge!.amount } } }),
  ]);

  await logActivity("Misafir siparişini onayladı", `${charge!.name} · ${fmtMoney(charge!.amount)}`, reservationId);
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel/rezervasyonlar");
  revalidatePath("/panel");
  redirect(`/panel/musteriler/${guestId}?ok=servis-onaylandi`);
}

/** Bekleyen bir misafir siparisini reddeder - hicbir zaman tutara islenmez, kayit gecmis icin kalir. */
export async function rejectRoomServiceCharge(formData: FormData) {
  const id = String(formData.get("id"));
  const guestId = String(formData.get("guestId"));

  const charge = await prisma.roomServiceCharge.update({ where: { id }, data: { status: "REDDEDILDI" } });

  await logActivity("Misafir siparişini reddetti", charge.name, charge.reservationId);
  revalidatePath(`/panel/musteriler/${guestId}`);
  revalidatePath("/panel");
  redirect(`/panel/musteriler/${guestId}?ok=servis-reddedildi`);
}


