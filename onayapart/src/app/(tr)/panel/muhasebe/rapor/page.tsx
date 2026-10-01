import Link from "next/link";
import {
  getFinanceTotals,
  getExpenseByCategory,
  getIncomeByMethod,
  getAccountSummaries,
  getMonthlyProfitLoss,
  getLedgerInRange,
} from "@/lib/queries";
import { resolveRange, RANGE_PRESETS } from "@/lib/dateRange";
import { fmtMoney, fmtDate, toInputDate } from "@/lib/dates";
import ConfirmButton from "@/components/ConfirmButton";
import StatCard from "@/components/panel/StatCard";
import MuhasebeNav from "@/components/panel/MuhasebeNav";
import MonthlyBarChart from "@/components/panel/charts/MonthlyBarChart";
import ExpenseDonut from "@/components/panel/charts/ExpenseDonut";
import MethodBars from "@/components/panel/charts/MethodBars";
import { deleteTransaction } from "../actions";

export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABEL: Record<string, string> = { KASA: "Kasa", BANKA: "Banka / POS" };
const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };

export default async function RaporPage({
  searchParams,
}: {
  searchParams: { ok?: string; aralik?: string; bas?: string; bit?: string };
}) {
  const now = new Date();
  const range = resolveRange(searchParams.aralik, searchParams.bas, searchParams.bit);

  const [totals, expenseByCategory, incomeByMethod, accountSummaries, monthlyReport, ledger] = await Promise.all([
    getFinanceTotals(range.start, range.end),
    getExpenseByCategory(range.start, range.end),
    getIncomeByMethod(range.start, range.end),
    getAccountSummaries(range.start, range.end),
    getMonthlyProfitLoss(12),
    getLedgerInRange(range.start, range.end),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Rapor</h1>
      <p className="mt-1 text-sm text-ink-soft">Seçtiğiniz döneme göre gelir, gider, kâr/zarar ve dağılım raporları.</p>

      <div className="mt-5">
        <MuhasebeNav active="rapor" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={`/api/muhasebe/rapor-pdf?aralik=${range.preset}${searchParams.bas ? `&bas=${searchParams.bas}&bit=${searchParams.bit}` : ""}`}
          className="btn-outline"
        >
          📄 PDF olarak indir
        </a>
        <a
          href={`/api/muhasebe/csv?kind=rapor&aralik=${range.preset}${searchParams.bas ? `&bas=${searchParams.bas}&bit=${searchParams.bit}` : ""}`}
          className="btn-outline"
        >
          📊 Excel (CSV) olarak indir
        </a>
      </div>

      {searchParams.ok === "silindi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Kayıt silindi.</p>
      )}

      {/* TARIH ARALIGI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-3 font-extrabold tracking-tight">Rapor dönemi</h2>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_PRESETS.map((p) => (
            <Link
              key={p.key}
              href={`/panel/muhasebe/rapor?aralik=${p.key}`}
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
          <button className="btn-primary">Raporu getir</button>
          <span className="ml-auto text-sm text-ink-soft">
            Gösterilen dönem: <b className="text-ink">{range.label}</b>
          </span>
        </form>
      </section>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`Gelir · ${range.label}`} value={fmtMoney(totals.income)} icon="cash" tone="brand" note="tahsilat + diğer gelir" />
        <StatCard label={`Gider · ${range.label}`} value={fmtMoney(totals.expense)} icon="receipt" tone="danger" note="tüm kategoriler" />
        <StatCard
          label="Net kâr / zarar"
          value={fmtMoney(totals.profit)}
          icon={totals.profit >= 0 ? "trendUp" : "trendDown"}
          tone={totals.profit >= 0 ? "brand" : "danger"}
          note={range.label}
        />
        <StatCard label="Kredi kartı tahsilatı" value={fmtMoney(incomeByMethod.KART ?? 0)} icon="card" tone="gold" note={range.label} />
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Aylık gelir / gider grafiği</h2>
        <p className="mb-2 text-sm text-ink-soft">Son 6 ayın karşılaştırması.</p>
        <MonthlyBarChart data={monthlyReport.slice(0, 6).reverse().map((m) => ({ label: m.label.split(" ")[0], income: m.income, expense: m.expense }))} />
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Tahsilat yöntemine göre</h2>
          <MethodBars totals={incomeByMethod} />
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <div>
              <div className="text-xs text-ink-soft">Konaklama tahsilatı</div>
              <div className="font-extrabold">{fmtMoney(totals.reservationIncome)}</div>
            </div>
            <div>
              <div className="text-xs text-ink-soft">Diğer gelirler</div>
              <div className="font-extrabold">{fmtMoney(totals.otherIncome)}</div>
            </div>
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Giderin kategori dağılımı</h2>
          <ExpenseDonut data={expenseByCategory.map((c) => ({ label: c.label, amount: c.amount }))} />
        </section>
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Kasa ve banka — dönem özeti</h2>
        <p className="mb-4 text-sm text-ink-soft">Detaylı hareket dökümü için Kasa / Banka butonlarını kullanın.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Hesap</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2 text-right">Dönem girişi</th>
                <th className="pb-2 text-right">Dönem çıkışı</th>
              </tr>
            </thead>
            <tbody>
              {accountSummaries.map((s) => (
                <tr key={s.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 font-semibold">{s.name}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{ACCOUNT_TYPE_LABEL[s.type] ?? s.type}</td>
                  <td className="py-2.5 text-right text-brand-600">{fmtMoney(s.inflow)}</td>
                  <td className="py-2.5 text-right text-danger-500">{fmtMoney(s.outflow)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold tracking-tight">Dönem ekstresi — {range.label}</h2>
          <a
            href={`/api/muhasebe/csv?kind=rapor&aralik=${range.preset}${searchParams.bas ? `&bas=${searchParams.bas}&bit=${searchParams.bit}` : ""}`}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            📊 Excel (CSV) indir
          </a>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Seçtiğiniz döneme ait tüm gelir ve gider hareketleri; açıklama, kategori, hesap, ödeme yöntemi ve tutarıyla.
        </p>
        {ledger.length === 0 ? (
          <p className="text-sm text-ink-soft">Bu dönemde hareket yok.</p>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Açıklama</th>
                <th className="pb-2">Kategori</th>
                <th className="pb-2">Hesap</th>
                <th className="pb-2">Yöntem</th>
                <th className="pb-2 text-right">Tutar</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((l) => (
                <tr key={l.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs">{fmtDate(l.date)}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.type === "GELIR" ? "bg-brand-50 text-brand-600" : "bg-danger-50 text-danger-700"}`}>
                      {l.type === "GELIR" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="py-2.5">{l.title}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{l.category}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{l.accountName}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{METHOD_LABEL[l.method] ?? l.method}</td>
                  <td className={`py-2.5 text-right font-bold tabular-nums ${l.type === "GELIR" ? "text-brand-600" : "text-danger-500"}`}>
                    {l.type === "GELIR" ? "+" : "−"}
                    {fmtMoney(l.amount)}
                  </td>
                  <td className="py-2.5">
                    {l.source === "MANUEL" && (
                      <form action={deleteTransaction}>
                        <input type="hidden" name="id" value={l.id.replace("tx-", "")} />
                        <input type="hidden" name="back" value="/panel/muhasebe/rapor" />
                        <ConfirmButton message="Bu kayıt silinsin mi?" className="text-xs text-ink-soft hover:text-red-700">
                          Sil
                        </ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-brand-300 bg-brand-50/40">
                <td colSpan={6} className="py-2.5 text-right text-xs font-bold text-ink-soft">
                  Toplam gelir
                </td>
                <td className="py-2.5 text-right font-extrabold text-brand-600 tabular-nums">
                  {fmtMoney(ledger.filter((l) => l.type === "GELIR").reduce((s, l) => s + l.amount, 0))}
                </td>
                <td />
              </tr>
              <tr className="bg-brand-50/40">
                <td colSpan={6} className="py-2.5 text-right text-xs font-bold text-ink-soft">
                  Toplam gider
                </td>
                <td className="py-2.5 text-right font-extrabold text-danger-500 tabular-nums">
                  {fmtMoney(ledger.filter((l) => l.type === "GIDER").reduce((s, l) => s + l.amount, 0))}
                </td>
                <td />
              </tr>
              <tr className="bg-brand-50/40">
                <td colSpan={6} className="py-3 text-right text-xs font-bold text-ink-soft">
                  Net (Gelir − Gider)
                </td>
                <td className="py-3 text-right text-base font-extrabold tabular-nums">
                  {fmtMoney(
                    ledger.filter((l) => l.type === "GELIR").reduce((s, l) => s + l.amount, 0) -
                      ledger.filter((l) => l.type === "GIDER").reduce((s, l) => s + l.amount, 0)
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Aylık kâr / zarar — son 12 ay</h2>
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-ink-soft">
              <th className="pb-2">Ay</th>
              <th className="pb-2 text-right">Gelir</th>
              <th className="pb-2 text-right">Gider</th>
              <th className="pb-2 text-right">Kâr / Zarar</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReport.map((m) => (
              <tr key={`${m.year}-${m.month}`} className="border-t border-line transition hover:bg-brand-50/30">
                <td className="py-2.5 font-semibold capitalize">{m.label}</td>
                <td className="py-2.5 text-right text-brand-600">{fmtMoney(m.income)}</td>
                <td className="py-2.5 text-right text-danger-500">{fmtMoney(m.expense)}</td>
                <td className={`py-2.5 text-right font-bold ${m.profit >= 0 ? "text-brand-600" : "text-danger-500"}`}>
                  {fmtMoney(m.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
