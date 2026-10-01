import { getDictionary } from "@/shared/i18n/dictionaries";
import type { Availability } from "@/features/rooms/availability";

const styles: Record<Availability, string> = {
  MUSAIT: "bg-brand-50 text-brand-600",
  DOLU: "bg-red-50 text-red-700",
  HARICI: "bg-violet-50 text-violet-700",
  TEMIZLIK: "bg-amber-50 text-amber-700",
  BAKIM: "bg-slate-100 text-slate-600",
};

/** `labels` verilmezse Turkce etiketler kullanilir (ceviri sayfalari sozlukten gecirir). */
export default function StatusBadge({ state, labels = getDictionary().availability }: { state: Availability; labels?: Record<Availability, string> }) {
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[state]}`}>{labels[state]}</span>;
}
