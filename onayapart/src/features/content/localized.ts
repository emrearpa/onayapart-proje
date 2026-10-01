import type { Locale } from "@/shared/i18n/config";
import { getFaqs } from "@/features/content/queries";
import { getBatchTranslations, withFallback } from "@/features/content/translations";

/**
 * Kayitlarin belirtilen metin alanlarini istenen dildeki cevirileriyle degistirir;
 * cevirisi olmayan alan Turkce kalir. Dil verilmezse kayitlar oldugu gibi doner.
 */
export async function localize<T extends { id: string }>(modelName: string, records: T[], fields: (keyof T & string)[], locale?: Locale): Promise<T[]> {
  if (!locale || records.length === 0) return records;
  const translations = await getBatchTranslations(modelName, records.map((r) => r.id), locale);

  return records.map((record) => {
    const translated = translations[record.id];
    if (!translated) return record;
    const overrides = Object.fromEntries(
      fields.filter((f) => typeof record[f] === "string").map((f) => [f, withFallback(record[f] as string, translated[f])])
    );
    return { ...record, ...overrides };
  });
}

/** Tek bir kaydin cevrilmis hali. */
export async function localizeOne<T extends { id: string }>(modelName: string, record: T, fields: (keyof T & string)[], locale?: Locale): Promise<T> {
  return (await localize(modelName, [record], fields, locale))[0];
}

export async function getLocalizedFaqs(locale?: Locale, homepageOnly = false) {
  return localize("Faq", await getFaqs(homepageOnly), ["question", "answer"], locale);
}
