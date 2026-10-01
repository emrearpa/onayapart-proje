import Link from "next/link";
import { getCardTransactions } from "@/lib/queries";
import { resolveRange, RANGE_PRESETS } from "@/lib/dateRange";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/dates";
import MuhasebeNav from "@/components/panel/MuhasebeNav";

export const dynamic = "force-dynamic";

export default async function PosPage({
  searchParams,
}: {
  searchParams: { aralik?: string; bas?: string; bit?: string };
}) {
  const now = new Date();
  const range = resolveRange(searchParams.aralik, searchParams.bas, searchParams.bit);
  const entries = await getCardTransactions(range.start, range.end);

  const totalIncome = entries.filter((e) => e.type === "GELIR").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "GIDER").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Pos İşlemleri</h1>
      <p className="mt-1 text-sm text-ink-soft">Kredi kartıyla (POS) yapılan tüm tahsilat ve ödemeler.</p>

      <div className="mt-5">
        <MuhasebeNav active="pos" />
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-extrabold tracking-tight">Dönem</h2>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_PRESETS.map((p) => (
            <Link
              key={p.key}
              href={`/panel/muhasebe/pos?aralik=${p.key}`}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                range.preset === p.key ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:border-brand-300"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <form method="get" className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="aralik" value="ozel" />
          <label className="text-xs font-bold">
            Başlangıç
            <input type="date" name="bas" defaultValue={searchParams.bas ?? toInputDate(range.start)} className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Bitiş
            <input type="date" name="bit" defaultValue={searchParams.bit ?? toInputDate(now)} className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <button className="btn-primary">Getir</button>
        </form>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs text-ink-soft">Kart ile tahsilat</div>
          <div className="mt-1 text-xl font-extrabold text-brand-600">{fmtMoney(totalIncome)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft">Kart ile ödeme (gider)</div>
          <div className="mt-1 text-xl font-extrabold text-danger-500">{fmtMoney(totalExpense)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft">İşlem sayısı</div>
          <div className="mt-1 text-xl font-extrabold">{entries.length}</div>
        </div>
      </div>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold tracking-tight">Pos hareketleri — {range.label}</h2>
          <a href={`/api/muhasebe/csv?kind=pos&aralik=${range.preset}${searchParams.bas ? `&bas=${searchParams.bas}&bit=${searchParams.bit}` : ""}`} className="text-xs font-bold text-brand-600 hover:underline">
            📊 Excel (CSV) indir
          </a>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-ink-soft">Bu dönemde kredi kartıyla işlem yok.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Açıklama</th>
                <th className="pb-2">Hesap</th>
                <th className="pb-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs">{fmtDate(e.date)}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${e.type === "GELIR" ? "bg-brand-50 text-brand-600" : "bg-danger-50 text-danger-700"}`}>
                      {e.type === "GELIR" ? "Tahsilat" : "Ödeme"}
                    </span>
                  </td>
                  <td className="py-2.5">{e.title}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{e.accountName}</td>
                  <td className={`py-2.5 text-right font-bold tabular-nums ${e.type === "GELIR" ? "text-brand-600" : "text-danger-500"}`}>
                    {e.type === "GELIR" ? "+" : "−"}
                    {fmtMoney(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
