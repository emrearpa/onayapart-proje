import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { prisma } from "@/lib/db";
import { parseEnabledLocales } from "@/lib/i18n/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [types, rooms, settings] = await Promise.all([
    prisma.roomType.findMany({ select: { slug: true } }),
    prisma.room.findMany({ where: { isPublished: true }, select: { number: true, type: { select: { slug: true } } } }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);
  const enabledLocales = parseEnabledLocales(settings?.enabledLocales);

  const statics = [
    "",
    "/odalar",
    "/gunluk-kiralik-apart-erzurum",
    "/aylik-kiralik-apart-erzurum",
    "/erzurum-ogrenci-apart",
    "/sss",
    "/iletisim",
  ].map((p) => ({ url: `${site.url}${p}`, lastModified: new Date(), priority: p === "" ? 1 : 0.8 }));

  const localePages = enabledLocales.flatMap((l) => [
    { url: `${site.url}/${l}`, lastModified: new Date(), priority: 0.9 },
    { url: `${site.url}/${l}/odalar`, lastModified: new Date(), priority: 0.8 },
    { url: `${site.url}/${l}/gunluk-kiralik-apart-erzurum`, lastModified: new Date(), priority: 0.7 },
    { url: `${site.url}/${l}/aylik-kiralik-apart-erzurum`, lastModified: new Date(), priority: 0.7 },
    { url: `${site.url}/${l}/erzurum-ogrenci-apart`, lastModified: new Date(), priority: 0.7 },
    { url: `${site.url}/${l}/sss`, lastModified: new Date(), priority: 0.6 },
    { url: `${site.url}/${l}/iletisim`, lastModified: new Date(), priority: 0.6 },
    { url: `${site.url}/${l}/menu`, lastModified: new Date(), priority: 0.6 },
    ...types.map((t) => ({ url: `${site.url}/${l}/odalar/${t.slug}`, lastModified: new Date(), priority: 0.8 })),
  ]);

  return [
    ...statics,
    ...localePages,
    ...types.map((t) => ({ url: `${site.url}/odalar/${t.slug}`, lastModified: new Date(), priority: 0.9 })),
    ...rooms.map((r) => ({
      url: `${site.url}/odalar/${r.type.slug}/oda-${r.number}`,
      lastModified: new Date(),
      priority: 0.7,
    })),
  ];
}
