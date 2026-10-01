import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/i18n/config";

/**
 * Panelden girilen dinamik icerigin (oda aciklamalari, SSS, menu urunleri vb.)
 * cok dilli cevirilerini yonetir. Tek bir genel Translation tablosu kullanilir,
 * her model icin ayri kolon eklemek yerine.
 */

export type FieldTranslations = Record<string, string>; // fieldName -> value
export type RecordTranslations = Record<string, FieldTranslations>; // recordId -> {fieldName: value}

/** Bir kaydin tek bir dildeki tum alan cevirilerini getirir (panel duzenleme formu icin). */
export async function getRecordTranslations(modelName: string, recordId: string): Promise<Record<Locale, FieldTranslations>> {
  const rows = await prisma.translation.findMany({ where: { modelName, recordId } });
  const result: Record<string, FieldTranslations> = { en: {}, ar: {}, fa: {}, ru: {}, de: {}, fr: {}, es: {}, az: {}, ka: {} };
  for (const row of rows) {
    if (!result[row.locale]) result[row.locale] = {};
    result[row.locale][row.fieldName] = row.value;
  }
  return result as Record<Locale, FieldTranslations>;
}

/**
 * Birden fazla kaydin, TEK bir dildeki ceviri alanlarini toplu getirir - liste
 * sayfalarinda (SSS listesi, oda tipleri vb.) N+1 sorgu olusmasin diye.
 */
export async function getBatchTranslations(modelName: string, recordIds: string[], locale: Locale): Promise<RecordTranslations> {
  if (recordIds.length === 0) return {};
  const rows = await prisma.translation.findMany({
    where: { modelName, recordId: { in: recordIds }, locale },
  });
  const result: RecordTranslations = {};
  for (const row of rows) {
    if (!result[row.recordId]) result[row.recordId] = {};
    result[row.recordId][row.fieldName] = row.value;
  }
  return result;
}

/**
 * Birden fazla kaydin, TUM (4) dildeki ceviri alanlarini TEK sorguda getirir -
 * panel liste sayfalarinda (SSS, olanaklar, oda tipleri) her kayit icin ayri ayri
 * getRecordTranslations cagirmak yerine bunu kullanin; N+1 sorgudan kacinir.
 */
export async function getBatchRecordTranslations(
  modelName: string,
  recordIds: string[]
): Promise<Record<string, Record<Locale, FieldTranslations>>> {
  const result: Record<string, Record<Locale, FieldTranslations>> = {};
  for (const id of recordIds) {
    result[id] = { en: {}, ar: {}, fa: {}, ru: {}, de: {}, fr: {}, es: {}, az: {}, ka: {} };
  }
  if (recordIds.length === 0) return result;

  const rows = await prisma.translation.findMany({
    where: { modelName, recordId: { in: recordIds } },
  });
  for (const row of rows) {
    if (!result[row.recordId]) result[row.recordId] = { en: {}, ar: {}, fa: {}, ru: {}, de: {}, fr: {}, es: {}, az: {}, ka: {} };
    if (!result[row.recordId][row.locale as Locale]) result[row.recordId][row.locale as Locale] = {};
    result[row.recordId][row.locale as Locale][row.fieldName] = row.value;
  }
  return result;
}

/** Turkce (varsayilan) degeri, o dilde ceviri varsa onunla degistirir; yoksa Turkceyi dondurur. */
export function withFallback(turkish: string, translated: string | undefined | null): string {
  const t = (translated ?? "").trim();
  return t || turkish;
}

/**
 * Panel formundan gelen ceviri alanlarini kaydeder. formData icinde
 * `tr_<fieldName>` (referans, kaydedilmez) ve `<locale>_<fieldName>` seklinde
 * alanlar beklenir, ornegin: en_name, ar_name, fa_description ...
 * Bos birakilan ceviriler siler (o dilde henuz cevrilmemis sayilir, Turkce'ye duser).
 */
export async function saveTranslationsFromForm(
  modelName: string,
  recordId: string,
  formData: FormData,
  fieldNames: string[]
) {
  const locales: Locale[] = ["en", "ar", "fa", "ru"];
  const ops: Promise<unknown>[] = [];

  for (const locale of locales) {
    for (const fieldName of fieldNames) {
      const value = String(formData.get(`${locale}_${fieldName}`) ?? "").trim();
      if (value) {
        ops.push(
          prisma.translation.upsert({
            where: { modelName_recordId_fieldName_locale: { modelName, recordId, fieldName, locale } },
            update: { value },
            create: { modelName, recordId, fieldName, locale, value },
          })
        );
      } else {
        ops.push(
          prisma.translation.deleteMany({ where: { modelName, recordId, fieldName, locale } })
        );
      }
    }
  }

  await Promise.all(ops);
}
