import { fmtDate } from "@/shared/lib/dates";

export type DateRange = { start: Date; end: Date; label: string; preset: string };

/** Muhasebe alt sayfalarinin ortak "rapor donemi" cozucusu: hazir secenekler
 *  (bu ay / gecen ay / son 3 ay / bu yil) veya ozel iki tarih araligi. */
export function resolveRange(preset?: string, from?: string, to?: string): DateRange {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (preset === "gecen-ay") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: startOfMonth,
      label: "Geçen ay",
      preset,
    };
  }
  if (preset === "bu-yil") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
      label: "Bu yıl",
      preset,
    };
  }
  if (preset === "son-3-ay") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      label: "Son 3 ay",
      preset,
    };
  }
  if (preset === "ozel" && from && to) {
    const start = new Date(from);
    const end = new Date(to);
    end.setDate(end.getDate() + 1); // bitis gunu dahil olsun
    return { start, end, label: `${fmtDate(start)} – ${fmtDate(new Date(end.getTime() - 86400000))}`, preset };
  }

  return {
    start: startOfMonth,
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    label: "Bu ay",
    preset: "bu-ay",
  };
}

export const RANGE_PRESETS = [
  { key: "bu-ay", label: "Bu ay" },
  { key: "gecen-ay", label: "Geçen ay" },
  { key: "son-3-ay", label: "Son 3 ay" },
  { key: "bu-yil", label: "Bu yıl" },
];
