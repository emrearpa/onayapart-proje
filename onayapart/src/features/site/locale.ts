import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/shared/i18n/config";

/** /[locale]/... rotalarinin params tipi. */
export type LocaleParams<Extra extends Record<string, string> = Record<never, never>> = { params: { locale: string } & Extra };

/** Adresteki dil parcasini dogrular; desteklenmeyen bir deger 404 verir. */
export function toLocale(value: string): Locale {
  if (!isLocale(value)) notFound();
  return value;
}

/**
 * generateStaticParams icin guvenli sarmalayici: derleme sirasinda veritabanina
 * ulasilamazsa (orn. Docker imaji derlenirken) derleme kirilmaz; sayfalar ilk
 * istekte uretilir ve onbelleklenir.
 */
export async function staticParams<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch {
    console.warn("[build] Veritabanina ulasilamadi; dinamik sayfalar ilk istekte uretilecek.");
    return [];
  }
}
