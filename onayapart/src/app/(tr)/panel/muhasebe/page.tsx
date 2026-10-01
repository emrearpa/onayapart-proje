import Link from "next/link";
import { getAccounts, getFinanceTotals, getRecentLedger } from "@/lib/queries";
import { getIntegrationSettings } from "@/lib/iyzico";
import { fmtMoney, fmtDate } from "@/lib/dates";
import StatCard from "@/components/panel/StatCard";
import MuhasebeNav from "@/components/panel/MuhasebeNav";
import { createAccount, updateIyzicoSettings } from "./actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "hesap-eklendi": "Hesap eklendi.",
  "kayit-eklendi": "Kayıt eklendi.",
  silindi: "Kayıt silindi.",
  "odeme-ayar": "Online ödeme ayarları kaydedildi.",
};
const ERRORS: Record<string, string> = {
  "hesap-eksik": "Hesap adı zorunludur.",
};
const ACCOUNT_TYPE_LABEL: Record<string, string> = { KASA: "Kasa", BANKA: "Banka / POS" };
const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };

export default async function AccountingOverviewPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [accounts, totals, ledger, integration] = await Promise.all([
    getAccounts(),
    getFinanceTotals(monthStart, monthEnd),
    getRecentLedger(10),
    getIntegrationSettings(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Ön Muhasebe</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Aşağıdan istediğiniz işleme gidin — her bölüm kendi ekranında açılır.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok]}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {/* 5 BUYUK ISLEM BUTONU */}
      <div className="mt-5">
        <MuhasebeNav />
      </div>

      {/* OZET GOSTERGELER */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bu ay gelir" value={fmtMoney(totals.income)} icon="cash" tone="brand" note="tahsilat + diğer gelir" />
        <StatCard label="Bu ay gider" value={fmtMoney(totals.expense)} icon="receipt" tone="danger" note="tüm kategoriler" />
        <StatCard
          label="Net kâr / zarar"
          value={fmtMoney(totals.profit)}
          icon={totals.profit >= 0 ? "trendUp" : "trendDown"}
          tone={totals.profit >= 0 ? "brand" : "danger"}
          note="bu ay"
        />
        <StatCard label="Toplam kasa + banka" value={fmtMoney(accounts.reduce((s, a) => s + a.balance, 0))} icon="bank" tone="gold" note={`${accounts.length} hesap`} />
      </div>

      {/* KASA / BANKA BAKIYELERI */}
      <section className="card mt-5 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold tracking-tight">Hesap bakiyeleri</h2>
          <span className="text-xs text-ink-soft">Detaylı hareketler için üstteki Kasa / Banka / Pos butonlarını kullanın</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((a) => (
            <div key={a.id} className="rounded-xl border border-line p-4">
              <div className="flex items-center justify-between">
                <span className="font-extrabold">{a.name}</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                  {ACCOUNT_TYPE_LABEL[a.type] ?? a.type}
                </span>
              </div>
              <div className={`mt-2 text-xl font-extrabold tabular-nums ${a.balance < 0 ? "text-danger-500" : "text-ink"}`}>
                {fmtMoney(a.balance)}
              </div>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold text-brand-600">+ Yeni kasa/banka hesabı ekle</summary>
          <form action={createAccount} className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold">
              Hesap adı
              <input name="name" placeholder="Örn. İş Bankası POS" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Tür
              <select name="type" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                <option value="KASA">Kasa (nakit)</option>
                <option value="BANKA">Banka / POS</option>
              </select>
            </label>
            <label className="text-xs font-bold">
              Açılış bakiyesi (₺)
              <input name="openingBalance" type="number" step={50} defaultValue={0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <div className="sm:col-span-3">
              <button className="btn-primary">Hesabı ekle</button>
            </div>
          </form>
        </details>
      </section>

      {/* IYZICO ONLINE ODEME */}
      <section className="card mt-5 overflow-hidden p-0">
        <div className={`flex items-center justify-between gap-3 px-5 py-4 ${integration.iyzicoEnabled ? "bg-brand-50" : "bg-slate-50"}`}>
          <div>
            <h2 className="font-extrabold tracking-tight">Online ödeme (iyzico)</h2>
            <p className="text-xs text-ink-soft">
              Açarsanız müşteriler kendi panellerinden bakiyelerini kredi kartıyla ödeyebilir. İstediğiniz an
              kapatabilirsiniz, kapalıyken müşteri panelinde ödeme butonu hiç görünmez.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              integration.iyzicoEnabled ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {integration.iyzicoEnabled ? "Açık" : "Kapalı"}
          </span>
        </div>

        <form action={updateIyzicoSettings} className="grid gap-3 p-5 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="iyzicoEnabled" defaultChecked={integration.iyzicoEnabled} className="h-4 w-4" />
            Online ödemeyi etkinleştir
          </label>

          <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
            <input type="checkbox" name="iyzicoSandbox" defaultChecked={integration.iyzicoSandbox} className="h-4 w-4" />
            Test (sandbox) modu — gerçek işyeri hesabınız onaylanana kadar işaretli bırakın
          </label>

          <label className="text-xs font-bold">
            API Key
            <input
              name="iyzicoApiKey"
              placeholder={integration.iyzicoApiKey ? "•••••••• (kayıtlı — değiştirmek için yazın)" : "sandbox-..."}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-bold">
            Secret Key
            <input
              name="iyzicoSecretKey"
              type="password"
              placeholder={integration.iyzicoSecretKey ? "•••••••• (kayıtlı — değiştirmek için yazın)" : "sandbox-..."}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold sm:col-span-2">
            Ödemelerin düşeceği hesap
            <select
              name="iyzicoDefaultAccountId"
              defaultValue={integration.iyzicoDefaultAccountId ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            >
              <option value="">Belirtilmedi</option>
              {accounts
                .filter((a) => a.type === "BANKA")
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <button className="btn-primary">Kaydet</button>
          </div>
        </form>

        <div className="border-t border-line bg-brand-50/30 px-5 py-4 text-xs text-ink-soft">
          API anahtarlarınız yoksa{" "}
          <a href="https://www.iyzico.com" target="_blank" rel="noopener" className="font-bold text-brand-600 hover:underline">
            iyzico.com
          </a>
          &apos;dan ücretsiz bir test (sandbox) hesabı açıp anahtarlarınızı buraya girebilirsiniz. Gerçek ödeme almak
          için işyeri hesabınızın iyzico tarafından onaylanması gerekir — o zamana kadar test modunda geliştirmeye
          devam edebilirsiniz.
        </div>
      </section>

      {/* SON HAREKETLER (KISA) */}
      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold tracking-tight">Son hareketler</h2>
          <Link href="/panel/muhasebe/rapor" className="text-xs font-bold text-brand-600">
            Tüm raporu gör →
          </Link>
        </div>
        {ledger.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz bir hareket yok.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Açıklama</th>
                <th className="pb-2">Hesap</th>
                <th className="pb-2">Yöntem</th>
                <th className="pb-2 text-right">Tutar</th>
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
                  <td className="py-2.5 text-xs text-ink-soft">{l.accountName}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{METHOD_LABEL[l.method] ?? l.method}</td>
                  <td className={`py-2.5 text-right font-bold tabular-nums ${l.type === "GELIR" ? "text-brand-600" : "text-danger-500"}`}>
                    {l.type === "GELIR" ? "+" : "−"}
                    {fmtMoney(l.amount)}
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
