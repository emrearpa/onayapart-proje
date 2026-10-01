"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { checked, num, optStr, str } from "@/shared/lib/form";
import { slugify } from "@/shared/lib/text";
import { NO_LOCALES, locales } from "@/shared/i18n/config";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_ID } from "@/features/content/defaults";
import { deleteTranslations, saveTranslationsFromForm } from "@/features/content/translations";

// Site icerigi: iletisim bilgileri, ana sayfa metni, olanaklar, SSS ve musteri
// yorumlari. Hepsi panelden duzenlenir ve kaydedilince site sayfalari tazelenir.

const PAGE_PATH = "/panel/icerik";
const CONTACT_FIELDS = ["phoneDisplay", "phoneHref", "whatsapp", "addressStreet", "addressDistrict", "addressCity", "addressPostalCode"] as const;
const HERO_FIELDS = ["heroEyebrow", "heroTitle", "heroIntro"] as const;

function done(result: string): never {
  revalidatePath("/", "layout");
  redirect(`${PAGE_PATH}?ok=${result}`);
}

function fail(reason: string): never {
  redirect(`${PAGE_PATH}?hata=${reason}`);
}

/* ------------------------- Iletisim ve ana sayfa metni ------------------------- */

export async function updateSiteSettings(formData: FormData) {
  await requirePanel("icerik");
  const fields = Object.fromEntries([...CONTACT_FIELDS, ...HERO_FIELDS].map((key) => [key, str(formData, key)])) as Record<
    (typeof CONTACT_FIELDS)[number] | (typeof HERO_FIELDS)[number],
    string
  >;
  const required = [fields.phoneDisplay, fields.phoneHref, fields.addressStreet, fields.addressCity, fields.heroTitle];
  if (required.some((value) => !value)) fail("iletisim-eksik");

  const data = {
    ...fields,
    whatsapp: fields.whatsapp.replace(/\D/g, ""),
    heroImageUrl: optStr(formData, "heroImageUrl"),
  };

  await prisma.siteSetting.upsert({ where: { id: SITE_SETTINGS_ID }, update: data, create: { id: SITE_SETTINGS_ID, ...data } });
  await saveTranslationsFromForm("SiteSetting", SITE_SETTINGS_ID, formData, [...HERO_FIELDS]);
  await logActivity("Site iletişim/tanıtım bilgilerini güncelledi");
  done("iletisim");
}

/** Bu sitede hangi dillerin acik olacagini gunceller. */
export async function updateEnabledLocales(formData: FormData) {
  await requirePanel("icerik");
  const selected = locales.filter((l) => checked(formData, `locale_${l}`));
  const enabledLocales = selected.length > 0 ? selected.join(",") : NO_LOCALES;

  await prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: { enabledLocales },
    create: { id: SITE_SETTINGS_ID, ...DEFAULT_SITE_SETTINGS, enabledLocales },
  });
  await logActivity("Site dillerini güncelledi", selected.length > 0 ? enabledLocales : "yalnızca Türkçe");
  done("diller");
}

/* ------------------------- Olanaklar ------------------------- */

export async function createAmenity(formData: FormData) {
  await requirePanel("icerik");
  const label = str(formData, "label");
  if (!label) fail("olanak-eksik");

  let amenityId: string;
  try {
    const count = await prisma.amenity.count();
    amenityId = (await prisma.amenity.create({ data: { icon: slugify(label, `olanak-${Date.now()}`), label, sort: count + 1 } })).id;
  } catch {
    fail("olanak-cakisma");
  }

  await saveTranslationsFromForm("Amenity", amenityId, formData, ["label"]);
  done("olanak-eklendi");
}

export async function updateAmenity(formData: FormData) {
  await requirePanel("icerik");
  const id = str(formData, "id");
  const label = str(formData, "label");
  if (!label) fail("olanak-eksik");

  await prisma.amenity.update({ where: { id }, data: { label } });
  await saveTranslationsFromForm("Amenity", id, formData, ["label"]);
  done("olanak-guncellendi");
}

export async function deleteAmenity(formData: FormData) {
  await requirePanel("icerik");
  const id = str(formData, "id");
  await prisma.amenity.delete({ where: { id } });
  await deleteTranslations("Amenity", id);
  done("olanak-silindi");
}

/* ------------------------- Sikca sorulan sorular ------------------------- */

function readFaqFields(formData: FormData) {
  return { question: str(formData, "question"), answer: str(formData, "answer"), homepage: checked(formData, "homepage") };
}

export async function createFaq(formData: FormData) {
  await requirePanel("icerik");
  const data = readFaqFields(formData);
  if (!data.question || !data.answer) fail("sss-eksik");

  const faq = await prisma.faq.create({ data: { ...data, sort: (await prisma.faq.count()) + 1 } });
  await saveTranslationsFromForm("Faq", faq.id, formData, ["question", "answer"]);
  done("sss-eklendi");
}

export async function updateFaq(formData: FormData) {
  await requirePanel("icerik");
  const id = str(formData, "id");
  const data = readFaqFields(formData);
  if (!data.question || !data.answer) fail("sss-eksik");

  await prisma.faq.update({ where: { id }, data });
  await saveTranslationsFromForm("Faq", id, formData, ["question", "answer"]);
  done("sss-guncellendi");
}

export async function deleteFaq(formData: FormData) {
  await requirePanel("icerik");
  const id = str(formData, "id");
  await prisma.faq.delete({ where: { id } });
  await deleteTranslations("Faq", id);
  done("sss-silindi");
}

/* ------------------------- Musteri yorumlari ------------------------- */
// Personelin Google'dan elle secip kopyaladigi gercek yorumlar. Kasitli olarak API
// baglantisi yok: boylece yalnizca gosterilmek istenen yorumlar sitede cikar.

function readTestimonialFields(formData: FormData) {
  return {
    authorName: str(formData, "authorName"),
    text: str(formData, "text"),
    rating: Math.min(5, Math.max(1, Math.round(num(formData, "rating", 5)))),
  };
}

export async function createTestimonial(formData: FormData) {
  await requirePanel("icerik");
  const data = readTestimonialFields(formData);
  if (!data.authorName || !data.text) fail("yorum-eksik");

  await prisma.testimonial.create({ data: { ...data, sort: (await prisma.testimonial.count()) + 1 } });
  await logActivity("Müşteri yorumu ekledi", data.authorName);
  done("yorum-eklendi");
}

export async function updateTestimonial(formData: FormData) {
  await requirePanel("icerik");
  const data = readTestimonialFields(formData);
  if (!data.authorName || !data.text) fail("yorum-eksik");

  await prisma.testimonial.update({ where: { id: str(formData, "id") }, data: { ...data, isPublished: checked(formData, "isPublished") } });
  done("yorum-guncellendi");
}

export async function deleteTestimonial(formData: FormData) {
  await requirePanel("icerik");
  await prisma.testimonial.delete({ where: { id: str(formData, "id") } });
  done("yorum-silindi");
}
