import type { MetadataRoute } from "next";
import { site } from "@/shared/lib/site";
import { getEnabledLocales, getSiteSettings } from "@/features/content/queries";
import { dailyLanding } from "@/features/content/landing/daily";
import { monthlyLanding } from "@/features/content/landing/monthly";
import { studentLanding } from "@/features/content/landing/student";
import { roomPath } from "@/features/rooms/paths";
import { getPublishedRoomPaths } from "@/features/rooms/queries";

export const revalidate = 3600;

const LANDING_PATHS = [dailyLanding, monthlyLanding, studentLanding].map((page) => page.path);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ types, rooms }, locales, settings] = await Promise.all([getPublishedRoomPaths(), getEnabledLocales(), getSiteSettings()]);

  // Yol -> oncelik. Her yol Turkce ve acik olan her dil icin birer kez listelenir.
  const paths: [string, number][] = [
    ["", 1],
    ["/odalar", 0.9],
    ...LANDING_PATHS.map((path): [string, number] => [path, 0.8]),
    ["/sss", 0.6],
    ["/iletisim", 0.6],
    ...(settings.menuEnabled ? ([["/menu", 0.6]] as [string, number][]) : []),
    ...types.map((type): [string, number] => [`/odalar/${type.slug}`, 0.9]),
    ...rooms.map((room): [string, number] => [roomPath(room), 0.7]),
  ];

  const lastModified = new Date();
  return ["", ...locales.map((locale) => `/${locale}`)].flatMap((prefix) =>
    paths.map(([path, priority]) => ({
      url: `${site.url}${prefix}${path}`,
      lastModified,
      priority: prefix ? priority * 0.9 : priority,
    }))
  );
}
