import type { Locale } from "@/shared/i18n/config";
import { getDictionary, type Dictionary } from "@/shared/i18n/dictionaries";
import { fmtMoney } from "@/shared/lib/dates";

type Rate = { id: string; stayType: string; label: string; price: number };

/** Konaklama suresine gore fiyat tablosu. Fiyati 0 olan satirda "arayin" yazar. */
export default function RateTable({ rates, locale }: { rates: Rate[]; locale?: Locale }) {
  const t = getDictionary(locale);
  // Turkce sayfada panelde verilen satir adi, diger dillerde sozlukteki karsiligi gosterilir.
  const labelOf = (rate: Rate) => (locale ? t.stay[rate.stayType as keyof Dictionary["stay"]] ?? rate.label : rate.label);

  return (
    <table className="w-full text-sm">
      <tbody>
        {rates.map((rate) => (
          <tr key={rate.id} className="border-b border-line">
            <td className="py-2.5">{labelOf(rate)}</td>
            <td className="py-2.5 text-right font-bold">{rate.price ? fmtMoney(rate.price) : t.ui.call}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
