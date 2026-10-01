"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import { checked, num, optStr, positiveNum, safeReturnPath, str, uploadedFile } from "@/shared/lib/form";
import { slugify } from "@/shared/lib/text";
import { site } from "@/shared/lib/site";
import { ROOM_PHOTO_URL_PREFIX, deleteUpload, isExternalUrl, saveUpload } from "@/shared/lib/storage";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { saveTranslationsFromForm } from "@/features/content/translations";
import { sendWhatsappMessage } from "@/features/messaging/whatsapp";
import { roomPath } from "@/features/rooms/paths";
import { DEFAULT_RATES } from "@/features/reservations/constants";

const ROOM_CONDITIONS = ["MUSAIT", "TEMIZLIK", "BAKIM"];
const TYPE_TRANSLATED_FIELDS = ["name", "tagline", "description", "capacity", "features"];
const ROOM_TRANSLATED_FIELDS = ["beds", "view"];

const revalidateSite = () => revalidatePath("/", "layout");
const panelRoomPath = (roomNumber: string | number) => `/panel/odalar/${roomNumber}`;

/* ------------------------- Durum, yayin, fiyat ------------------------- */

/** Odanin temizlik/bakim durumunu degistirir ve site sayfalarini tazeler. */
export async function setRoomCondition(formData: FormData) {
  await requirePanel("odalar");
  const condition = str(formData, "condition");
  if (!ROOM_CONDITIONS.includes(condition)) return;
  await prisma.room.update({ where: { id: str(formData, "id") }, data: { condition } });
  revalidateSite();
}

export async function setRoomPublished(formData: FormData) {
  await requirePanel("odalar");
  await prisma.room.update({ where: { id: str(formData, "id") }, data: { isPublished: checked(formData, "isPublished") } });
  revalidateSite();
}

export async function setRate(formData: FormData) {
  await requirePanel("odalar");
  const rate = await prisma.rate.update({
    where: { id: str(formData, "id") },
    data: { price: positiveNum(formData, "price") },
    include: { type: true },
  });
  await logActivity("Fiyat güncelledi", `${rate.type.name} · ${rate.label} · ${fmtMoney(rate.price)}`);
  revalidateSite();
}

/* ------------------------- Oda tipleri ------------------------- */
// Panelden serbestce eklenip silinebilir. Yeni tip olusturulunca her konaklama
// suresi icin fiyat satiri otomatik acilir (0 = "fiyat icin arayin").

function readTypeFields(formData: FormData) {
  return {
    code: str(formData, "code"),
    slug: slugify(str(formData, "slug")),
    name: str(formData, "name"),
    tagline: str(formData, "tagline"),
    description: str(formData, "description"),
    seoTitle: str(formData, "seoTitle"),
    seoText: str(formData, "seoText"),
    minM2: positiveNum(formData, "minM2"),
    maxM2: positiveNum(formData, "maxM2"),
    capacity: str(formData, "capacity"),
    features: str(formData, "features"),
    imageUrl: optStr(formData, "imageUrl"),
  };
}

export async function createRoomType(formData: FormData) {
  await requirePanel("odalar");
  const data = readTypeFields(formData);
  if (!data.code || !data.slug || !data.name) redirect("/panel/tipler?hata=eksik");

  let typeId: string;
  try {
    const count = await prisma.roomType.count();
    const type = await prisma.roomType.create({
      data: { ...data, sort: count + 1, rates: { create: DEFAULT_RATES.map((r) => ({ ...r, price: 0 })) } },
    });
    typeId = type.id;
  } catch {
    redirect("/panel/tipler?hata=cakisma");
  }

  await saveTranslationsFromForm("RoomType", typeId, formData, TYPE_TRANSLATED_FIELDS);
  await logActivity("Oda tipi ekledi", data.name);
  revalidateSite();
  redirect("/panel/tipler?ok=eklendi");
}

export async function updateRoomType(formData: FormData) {
  await requirePanel("odalar");
  const id = str(formData, "id");
  const data = readTypeFields(formData);
  if (!data.code || !data.slug || !data.name) redirect("/panel/tipler?hata=eksik");

  try {
    await prisma.roomType.update({ where: { id }, data });
  } catch {
    redirect("/panel/tipler?hata=cakisma");
  }

  await saveTranslationsFromForm("RoomType", id, formData, TYPE_TRANSLATED_FIELDS);
  revalidateSite();
  redirect("/panel/tipler?ok=guncellendi");
}

export async function deleteRoomType(formData: FormData) {
  await requirePanel("odalar");
  const id = str(formData, "id");
  if ((await prisma.room.count({ where: { typeId: id } })) > 0) redirect("/panel/tipler?hata=dolu");

  const type = await prisma.roomType.delete({ where: { id } });
  await prisma.translation.deleteMany({ where: { modelName: "RoomType", recordId: id } });
  await logActivity("Oda tipi sildi", type.name);
  revalidateSite();
  redirect("/panel/tipler?ok=silindi");
}

/* ------------------------- Daireler ------------------------- */

function readRoomFields(formData: FormData) {
  const condition = str(formData, "condition");
  return {
    number: Math.trunc(positiveNum(formData, "number")),
    floor: Math.trunc(num(formData, "floor")),
    m2: Math.trunc(positiveNum(formData, "m2")),
    beds: str(formData, "beds"),
    view: str(formData, "view"),
    typeId: str(formData, "typeId"),
    condition: ROOM_CONDITIONS.includes(condition) ? condition : "MUSAIT",
    isPublished: checked(formData, "isPublished"),
  };
}

export async function createRoom(formData: FormData) {
  await requirePanel("odalar");
  const data = readRoomFields(formData);
  if (!data.number || !data.typeId) redirect("/panel/odalar?hata=eksik");

  let roomId: string;
  try {
    roomId = (await prisma.room.create({ data })).id;
  } catch {
    redirect("/panel/odalar?hata=cakisma");
  }

  await saveTranslationsFromForm("Room", roomId, formData, ROOM_TRANSLATED_FIELDS);
  await logActivity("Daire ekledi", `Oda ${data.number}`);
  revalidateSite();
  redirect("/panel/odalar?ok=eklendi");
}

export async function updateRoom(formData: FormData) {
  await requirePanel("odalar");
  const id = str(formData, "id");
  const oldNumber = str(formData, "oldNumber");
  const data = readRoomFields(formData);
  if (!data.number || !data.typeId) redirect(`${panelRoomPath(oldNumber)}?hata=eksik`);

  try {
    await prisma.room.update({ where: { id }, data });
  } catch {
    redirect(`${panelRoomPath(oldNumber)}?hata=cakisma`);
  }

  await saveTranslationsFromForm("Room", id, formData, ROOM_TRANSLATED_FIELDS);
  await logActivity("Daire bilgilerini güncelledi", `Oda ${data.number}`);
  revalidateSite();
  redirect(`${panelRoomPath(data.number)}?ok=guncellendi`);
}

export async function deleteRoom(formData: FormData) {
  await requirePanel("odalar");
  const id = str(formData, "id");
  const room = await prisma.room.findUnique({
    where: { id },
    select: { number: true, photos: { select: { url: true } }, _count: { select: { reservations: true } } },
  });
  if (!room) redirect("/panel/odalar");
  if (room._count.reservations > 0) redirect(`${panelRoomPath(room.number)}?hata=gecmis`);

  await prisma.room.delete({ where: { id } });
  await prisma.translation.deleteMany({ where: { modelName: "Room", recordId: id } });
  await Promise.all(room.photos.map((p) => deleteStoredPhoto(p.url)));

  await logActivity("Daire sildi", `Oda ${room.number}`);
  revalidateSite();
  redirect("/panel/odalar?ok=silindi");
}

/* ------------------------- Dairenin olanaklari ------------------------- */

/** Bir dairenin su anki olanak listesi - alan bossa (hic ozellestirilmemisse) tum
 *  olanaklar secili sayilir; sitedeki varsayilan davranisla ayni. */
async function resolveRoomAmenities(roomId: string): Promise<string[]> {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { amenities: true } });
  if (room?.amenities) return room.amenities.split(",").filter(Boolean);
  return (await prisma.amenity.findMany({ select: { icon: true } })).map((a) => a.icon);
}

async function saveRoomAmenities(roomId: string, icons: string[]) {
  await prisma.room.update({ where: { id: roomId }, data: { amenities: Array.from(new Set(icons)).join(",") } });
  revalidateSite();
}

/** Bu odaya, mevcut (genel) olanak listesinden bir tanesini ekler. */
export async function assignRoomAmenity(formData: FormData) {
  await requirePanel("odalar");
  const roomId = str(formData, "roomId");
  const back = panelRoomPath(str(formData, "roomNumber"));
  const icon = str(formData, "icon");
  if (!icon) redirect(back);

  await saveRoomAmenities(roomId, [...(await resolveRoomAmenities(roomId)), icon]);
  redirect(`${back}?ok=guncellendi`);
}

/** Bu odadan bir olanagi kaldirir (genel listeden silmez, sadece bu odada gorunmez). */
export async function removeRoomAmenity(formData: FormData) {
  await requirePanel("odalar");
  const roomId = str(formData, "roomId");
  const icon = str(formData, "icon");

  await saveRoomAmenities(roomId, (await resolveRoomAmenities(roomId)).filter((i) => i !== icon));
  redirect(`${panelRoomPath(str(formData, "roomNumber"))}?ok=guncellendi`);
}

/** Yepyeni bir olanak yaratip dogrudan bu odaya ekler. Genel katalogda da olusur,
 *  boylece baska odalarda da secilebilir. */
export async function createAndAssignAmenity(formData: FormData) {
  await requirePanel("odalar");
  const roomId = str(formData, "roomId");
  const back = panelRoomPath(str(formData, "roomNumber"));
  const label = str(formData, "label");
  if (!label) redirect(`${back}?hata=olanak-eksik`);

  const icon = slugify(label, `olanak-${Date.now()}`);
  const current = await resolveRoomAmenities(roomId);
  try {
    await prisma.amenity.create({ data: { icon, label, sort: (await prisma.amenity.count()) + 1 } });
  } catch {
    redirect(`${back}?hata=olanak-cakisma`);
  }

  await saveRoomAmenities(roomId, [...current, icon]);
  redirect(`${back}?ok=guncellendi`);
}

/* ------------------------- Demirbaslar ------------------------- */
// Odaya bagli; rezervasyon sozlesmesine otomatik yansir.

function readAssetFields(formData: FormData) {
  return {
    name: str(formData, "name"),
    quantity: Math.max(1, Math.trunc(num(formData, "quantity", 1))),
    note: optStr(formData, "note"),
  };
}

export async function createAsset(formData: FormData) {
  await requirePanel("odalar");
  const back = panelRoomPath(str(formData, "roomNumber"));
  const data = readAssetFields(formData);
  if (!data.name) redirect(`${back}?hata=demirbas-eksik`);

  await prisma.asset.create({ data: { roomId: str(formData, "roomId"), ...data } });
  redirect(`${back}?ok=demirbas`);
}

export async function updateAsset(formData: FormData) {
  await requirePanel("odalar");
  const back = panelRoomPath(str(formData, "roomNumber"));
  const data = readAssetFields(formData);
  if (!data.name) redirect(`${back}?hata=demirbas-eksik`);

  await prisma.asset.update({ where: { id: str(formData, "id") }, data });
  redirect(`${back}?ok=demirbas`);
}

export async function deleteAsset(formData: FormData) {
  await requirePanel("odalar");
  await prisma.asset.delete({ where: { id: str(formData, "id") } });
  redirect(`${panelRoomPath(str(formData, "roomNumber"))}?ok=demirbas`);
}

/* ------------------------- Fotograflar ------------------------- */
// Dosya yukleme kalici disk gerektirir (VPS / Docker volume, bkz. UPLOAD_DIR).
// Sunucusuz barindirmada "gorsel adresi" alani kullanilir.

async function deleteStoredPhoto(url: string) {
  if (url.startsWith(ROOM_PHOTO_URL_PREFIX)) await deleteUpload("odalar", url.slice(ROOM_PHOTO_URL_PREFIX.length));
}

export async function addPhoto(formData: FormData) {
  await requirePanel("odalar");
  const roomId = str(formData, "roomId");
  const roomNumber = str(formData, "roomNumber");
  const back = panelRoomPath(roomNumber);
  const file = uploadedFile(formData, "file");
  const externalUrl = str(formData, "url");

  let url: string;
  if (file) {
    const saved = await saveUpload("odalar", file, roomNumber);
    if (typeof saved === "string") redirect(`${back}?hata=${saved === "TOO_LARGE" ? "foto-buyuk" : "foto-tur"}`);
    url = `${ROOM_PHOTO_URL_PREFIX}${saved.storedName}`;
  } else if (isExternalUrl(externalUrl)) {
    url = externalUrl;
  } else {
    redirect(`${back}?hata=foto`);
  }

  const sort = await prisma.photo.count({ where: { roomId } });
  await prisma.photo.create({
    data: { roomId, url, alt: str(formData, "alt") || `${site.shortName} ${roomNumber} numaralı daire fotoğrafı`, sort },
  });

  revalidateSite();
  redirect(`${back}?ok=foto`);
}

export async function deletePhoto(formData: FormData) {
  await requirePanel("odalar");
  const photo = await prisma.photo.delete({ where: { id: str(formData, "id") } });
  await deleteStoredPhoto(photo.url);

  revalidateSite();
  redirect(`${panelRoomPath(str(formData, "roomNumber"))}?ok=foto`);
}

/* ------------------------- Oda bilgisini WhatsApp'tan gonder ------------------------- */

/**
 * Musteri telefonda "odayi gormek istiyorum" derse, personel telefon numarasini
 * girip tek tikla o odanin genel sayfasini WhatsApp'tan gonderir. WhatsApp API
 * yapilandirilmissa dogrudan gonderir; degilse hazir mesajla WhatsApp'i acar.
 */
export async function sendRoomInfoWhatsapp(formData: FormData) {
  await requirePanel("odalar", "rezervasyonlar");
  const phone = str(formData, "phone");

  const room = await prisma.room.findUnique({ where: { id: str(formData, "roomId") }, include: { type: true } });
  if (!room) redirect("/panel/odalar?hata=oda-bulunamadi");

  const back = safeReturnPath(str(formData, "back"), panelRoomPath(room.number));
  if (!phone) redirect(`${back}?hata=telefon-eksik`);

  const link = `${site.url}${roomPath(room)}`;
  const body = `Merhaba! İlgilendiğiniz daireyi buradan inceleyebilirsiniz: ${link}\n\nOda ${room.number} · ${room.type.name} · ${site.name}`;

  const result = await sendWhatsappMessage(phone, body);
  await prisma.messageLog.create({
    data: { phone, body, kind: "ODA_BILGISI", status: result.status, errorMessage: result.errorMessage ?? null },
  });
  await logActivity("Oda bilgisini WhatsApp'tan gönderdi", `Oda ${room.number} · ${phone}`);

  if (result.status === "LINK_HAZIRLANDI" && result.link) redirect(result.link);
  redirect(`${back}?ok=${result.status === "GONDERILDI" ? "wa-gonderildi" : "wa-hata"}`);
}
