import Link from "next/link";
import { getAccounts, getAccountStatement } from "@/features/accounting/queries";
import { resolveRange } from "@/features/accounting/date-range";
import { fmtMoney, fmtDate, toInputDate } from "@/shared/lib/dates";
import MuhasebeNav from "@/features/accounting/components/MuhasebeNav";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };

export default async function StatementPage({
  searchParams,
}: {
  searchParams: { hesap?: string; aralik?: string; bas?: string; bit?: string };
}) {
  const accounts = await getAccounts();
  const accountId = searchParams.hesap ?? accounts[0]?.id;
  const range = resolveRange(searchParams.aralik, searchParams.bas, searchParams.bit);

  const statement = accountId ? await getAccountStatement(accountId, range.start, range.end) : null;

  return (
    <div>
      <Link href="/panel/muhasebe" className="text-xs font-bold text-brand-600">
        ← Ön Muhasebe&apos;ye dön
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Hesap ekstresi</h1>
      <div className="mt-4">
        <MuhasebeNav />
      </div>
      <p className="mt-5 text-sm text-ink-soft">
        Seçilen kasa veya banka hesabının dönem içindeki tüm hareketleri, yürüyen bakiyesiyle birlikte.
      </p>

      <section className="card mt-5 p-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold">
            Hesap
            <select name="hesap" defaultValue={accountId} className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="aralik" value="ozel" />
          <label className="text-xs font-bold">
            Başlangıç
            <input
              type="date"
              name="bas"
              defaultValue={searchParams.bas ?? toInputDate(range.start)}
              className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-bold">
            Bitiş
            <input
              type="date"
              name="bit"
              defaultValue={searchParams.bit ?? toInputDate(new Date())}
              className="mt-1 block rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <button className="btn-primary">Ekstreyi getir</button>
        </form>
      </section>

      {!statement ? (
        <p className="mt-5 text-sm text-ink-soft">Hesap bulunamadı.</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="card p-4">
              <div className="text-xs text-ink-soft">Devir bakiyesi</div>
              <div className="mt-1 text-xl font-extrabold">{fmtMoney(statement.opening)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-ink-soft">Dönem hareketi</div>
              <div className="mt-1 text-xl font-extrabold">{statement.rows.length} kayıt</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-ink-soft">Dönem sonu bakiye</div>
              <div className={`mt-1 text-xl font-extrabold ${statement.closing < 0 ? "text-red-700" : "text-brand-600"}`}>
                {fmtMoney(statement.closing)}
              </div>
            </div>
          </div>

          <section className="card mt-5 overflow-x-auto p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-extrabold tracking-tight">
                {statement.account.name} — {range.label}
              </h2>
              <a
                href={`/api/muhasebe/csv?kind=ekstre&hesap=${accountId}&aralik=${range.preset ?? "ozel"}&bas=${toInputDate(range.start)}&bit=${toInputDate(new Date(range.end.getTime() - 86400000))}`}
                className="text-xs font-bold text-brand-600 hover:underline"
              >
                📊 Excel (CSV) indir
              </a>
            </div>
            <p className="mb-4 text-sm text-ink-soft">
              Devir bakiyesi, seçilen başlangıç tarihinden önceki tüm hareketlerin toplamıdır.
            </p>

            {statement.rows.length === 0 ? (
              <p className="text-sm text-ink-soft">Bu dönemde hareket yok.</p>
            ) : (
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-ink-soft">
                    <th className="pb-2">Tarih</th>
                    <th className="pb-2">Açıklama</th>
                    <th className="pb-2">Yöntem</th>
                    <th className="pb-2 text-right">Giriş</th>
                    <th className="pb-2 text-right">Çıkış</th>
                    <th className="pb-2 text-right">Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-line bg-brand-50/40">
                    <td className="py-2.5 text-xs" colSpan={5}>
                      <b>Devir bakiyesi</b>
                    </td>
                    <td className="py-2.5 text-right font-bold">{fmtMoney(statement.opening)}</td>
                  </tr>
                  {statement.rows.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="py-2.5 text-xs">{fmtDate(r.date)}</td>
                      <td className="py-2.5">{r.title}</td>
                      <td className="py-2.5 text-xs text-ink-soft">{METHOD_LABEL[r.method] ?? r.method}</td>
                      <td className="py-2.5 text-right text-brand-600">
                        {r.type === "GELIR" ? fmtMoney(r.amount) : "—"}
                      </td>
                      <td className="py-2.5 text-right text-red-700">
                        {r.type === "GIDER" ? fmtMoney(r.amount) : "—"}
                      </td>
                      <td className="py-2.5 text-right font-bold">{fmtMoney(r.balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-brand-300 bg-brand-50/40">
                    <td className="py-3 text-xs" colSpan={5}>
                      <b>Dönem sonu bakiye</b>
                    </td>
                    <td className="py-3 text-right font-extrabold">{fmtMoney(statement.closing)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
