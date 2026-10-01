import type { Metadata } from "next";
import { defaultLocale, type Locale } from "@/shared/i18n/config";
import { getEnabledLocales } from "@/features/content/queries";

/**
 * Bir sayfanin canonical ve hreflang bilgisi. Next.js'te bir sayfa kendi
 * `alternates`'ini tanimlarsa ust layout'takini tamamen ezer; bu yuzden her sayfa
 * bunu kendisi verir. Yalnizca panelde ACIK olan diller bildirilir.
 *
 * @param path   Turkce sayfanin yolu ("/" ya da "/odalar/..." gibi).
 * @param locale Sayfa bir ceviri sayfasiysa dili; canonical o dile gore kurulur.
 */
export async function pageAlternates(path: string, locale?: Locale): Promise<NonNullable<Metadata["alternates"]>> {
  const enabled = await getEnabledLocales();
  const suffix = path === "/" ? "" : path;

  const languages: Record<string, string> = { "x-default": path, [defaultLocale]: path };
  for (const l of enabled) languages[l] = `/${l}${suffix}`;

  return { canonical: locale ? `/${locale}${suffix}` : path, languages };
}
