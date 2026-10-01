import { prisma } from "@/shared/lib/db";
import { locales, type Locale } from "@/shared/i18n/config";

/**
 * Panelden girilen dinamik icerigin (oda aciklamalari, SSS, menu urunleri vb.)
 * cok dilli cevirilerini yonetir. Her model icin ayri kolon eklemek yerine tek
 * bir genel Translation tablosu kullanilir.
 */

export type FieldTranslations = Record<string, string>; // fieldName -> value
export type RecordTranslations = Record<string, FieldTranslations>; // recordId -> {fieldName: value}
export type LocaleTranslations = Record<Locale, FieldTranslations>;

const emptyLocaleMap = (): LocaleTranslations =>
  Object.fromEntries(locales.map((l) => [l, {}])) as LocaleTranslations;

/** Bir kaydin tum dillerdeki alan cevirileri (panel duzenleme formu icin). */
export async function getRecordTranslations(modelName: string, recordId: string): Promise<LocaleTranslations> {
  return (await getBatchRecordTranslations(modelName, [recordId]))[recordId];
}

/** Birden fazla kaydin TEK bir dildeki cevirilerini toplu getirir (site liste sayfalari; N+1 sorgu olmaz). */
export async function getBatchTranslations(modelName: string, recordIds: string[], locale: Locale): Promise<RecordTranslations> {
  if (recordIds.length === 0) return {};
  const rows = await prisma.translation.findMany({ where: { modelName, recordId: { in: recordIds }, locale } });

  const result: RecordTranslations = {};
  for (const row of rows) (result[row.recordId] ??= {})[row.fieldName] = row.value;
  return result;
}

/** Birden fazla kaydin TUM dillerdeki cevirilerini tek sorguda getirir (panel liste sayfalari). */
export async function getBatchRecordTranslations(modelName: string, recordIds: string[]): Promise<Record<string, LocaleTranslations>> {
  const result: Record<string, LocaleTranslations> = Object.fromEntries(recordIds.map((id) => [id, emptyLocaleMap()]));
  if (recordIds.length === 0) return result;

  const rows = await prisma.translation.findMany({ where: { modelName, recordId: { in: recordIds } } });
  for (const row of rows) {
    const byLocale = result[row.recordId]?.[row.locale as Locale];
    if (byLocale) byLocale[row.fieldName] = row.value;
  }
  return result;
}

/** O dilde ceviri varsa onu, yoksa Turkce (varsayilan) degeri dondurur. */
export function withFallback(turkish: string, translated: string | undefined | null): string {
  return (translated ?? "").trim() || turkish;
}

/**
 * Panel formundan gelen ceviri alanlarini kaydeder. Alanlar `<locale>_<fieldName>`
 * adiyla beklenir (en_name, ar_description ...). Bos birakilan ceviri silinir; o
 * dilde Turkce metne dusulur. Formda hic bulunmayan alanlara dokunulmaz.
 */
export async function saveTranslationsFromForm(modelName: string, recordId: string, formData: FormData, fieldNames: string[]) {
  const operations = [];

  for (const locale of locales) {
    for (const fieldName of fieldNames) {
      const raw = formData.get(`${locale}_${fieldName}`);
      if (typeof raw !== "string") continue;

      const value = raw.trim();
      const key = { modelName, recordId, fieldName, locale };
      operations.push(
        value
          ? prisma.translation.upsert({ where: { modelName_recordId_fieldName_locale: key }, update: { value }, create: { ...key, value } })
          : prisma.translation.deleteMany({ where: key })
      );
    }
  }

  if (operations.length > 0) await prisma.$transaction(operations);
}

/** Kayit silindiginde sahipsiz kalan cevirilerini temizler. */
export async function deleteTranslations(modelName: string, recordId: string) {
  await prisma.translation.deleteMany({ where: { modelName, recordId } });
}
