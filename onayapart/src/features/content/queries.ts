import { cache } from "react";
import { prisma } from "@/shared/lib/db";
import { DEFAULT_SITE_SETTINGS, SITE_SETTINGS_ID } from "@/features/content/defaults";
import { parseEnabledLocales } from "@/shared/i18n/config";

/** Panelden duzenlenen iletisim/tanitim bilgileri. Ayni istek icinde birden fazla bilesen
 *  cagirsa bile tek DB sorgusuna iner (React cache). Satir yoksa varsayilanlarla olusturur. */
export const getSiteSettings = cache(async () => {
  return prisma.siteSetting.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {},
    create: { id: SITE_SETTINGS_ID, ...DEFAULT_SITE_SETTINGS },
  });
});

/** Sitede acik olan diller (panelden yonetilir). */
export async function getEnabledLocales() {
  return parseEnabledLocales((await getSiteSettings()).enabledLocales);
}

export async function getFaqs(homepageOnly = false) {
  return prisma.faq.findMany({
    where: homepageOnly ? { homepage: true } : undefined,
    orderBy: { sort: "asc" },
  });
}

/** Sitede gosterilecek, personelin elle sectigi gercek musteri yorumlari. */
export async function getTestimonials() {
  return prisma.testimonial.findMany({ where: { isPublished: true }, orderBy: { sort: "asc" } });
}
