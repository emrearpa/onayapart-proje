import Link from "next/link";
import { getAccounts, getAccountTypeLedger } from "@/lib/queries";
import { resolveRange, RANGE_PRESETS } from "@/lib/dateRange";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/dates";
import MuhasebeNav from "@/components/panel/MuhasebeNav";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };

export default async function KasaPage({
  searchParams,
}: {
  searchParams: { aralik?: string; bas?: string; bit?: string };
}) {
  const now = new Date();
  const range = resolveRange(searchParams.aralik, searchParams.bas, searchParams.bit);

  const [accounts, entries] = await Promise.all([getAccounts(), getAccountTypeLedger("KASA", range.start, range.end)]);
  const typeAccounts = accounts.filter((a) => a.type === "KASA");
  const totalBalance = typeAccounts.reduce((s, a) => s + a.balance, 0);
  const inflow = entries.filter((e) => e.type === "GELIR").reduce((s, e) => s + e.amount, 0);
  const outflow = entries.filter((e) => e.type === "GIDER").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Kasa Hareketleri</h1>
      <p className="mt-1 text-sm text-ink-soft">Nakit kasanıza giren ve çıkan tüm hareketler.</p>

      <div className="mt-5">
        <MuhasebeNav active="kasa" />
      </div>

      {typeAccounts.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft">
          Henüz bu türde bir hesap yok.{" "}
          <Link href="/panel/muhasebe" className="font-bold text-brand-600">
            Ön Muhasebe ana sayfasından ekleyebilirsiniz →
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {typeAccounts.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="text-xs text-ink-soft">{a.name}</div>
                <div className={`mt-1 text-xl font-extrabold tabular-nums ${a.balance < 0 ? "text-danger-500" : "text-ink"}`}>
                  {fmtMoney(a.balance)}
                </div>
                <Link href={`/panel/muhasebe/ekstre?hesap=${a.id}`} className="mt-1 inline-block text-xs font-bold text-brand-600 hover:underline">
                  Detaylı ekstre →
                </Link>
              </div>
            ))}
          </div>

          <section className="card mt-5 p-5">
            <h2 className="mb-3 font-extrabold tracking-tight">Dönem</h2>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_PRESETS.map((p) => (
                <Link
                  key={p.key}
                  href={`/panel/muhasebe/kasa?aralik=${p.key}`}
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
              <div className="text-xs text-ink-soft">Toplam bakiye</div>
              <div className="mt-1 text-xl font-extrabold">{fmtMoney(totalBalance)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-ink-soft">Dönem girişi</div>
              <div className="mt-1 text-xl font-extrabold text-brand-600">{fmtMoney(inflow)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-ink-soft">Dönem çıkışı</div>
              <div className="mt-1 text-xl font-extrabold text-danger-500">{fmtMoney(outflow)}</div>
            </div>
          </div>

          <section className="card mt-5 overflow-x-auto p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold tracking-tight">Hareketler — {range.label}</h2>
              <a href={`/api/muhasebe/csv?kind=kasa&aralik=${range.preset}${searchParams.bas ? `&bas=${searchParams.bas}&bit=${searchParams.bit}` : ""}`} className="text-xs font-bold text-brand-600 hover:underline">
                📊 Excel (CSV) indir
              </a>
            </div>
            {entries.length === 0 ? (
              <p className="text-sm text-ink-soft">Bu dönemde hareket yok.</p>
            ) : (
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-ink-soft">
                    <th className="pb-2">Tarih</th>
                    <th className="pb-2">Açıklama</th>
                    <th className="pb-2">Hesap</th>
                    <th className="pb-2">Yöntem</th>
                    <th className="pb-2 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-line transition hover:bg-brand-50/30">
                      <td className="py-2.5 text-xs">{fmtDate(e.date)}</td>
                      <td className="py-2.5">{e.title}</td>
                      <td className="py-2.5 text-xs text-ink-soft">{e.accountName}</td>
                      <td className="py-2.5 text-xs text-ink-soft">{METHOD_LABEL[e.method] ?? e.method}</td>
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
        </>
      )}
    </div>
  );
}
