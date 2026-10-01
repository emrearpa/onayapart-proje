import { getAccounts, getRecentLedger } from "@/features/accounting/queries";
import { expenseCategories, incomeCategories } from "@/features/accounting/constants";
import { getInventoryItemsWithStock } from "@/features/inventory/queries";
import { fmtMoney, fmtDate, toInputDate } from "@/shared/lib/dates";
import ConfirmButton from "@/shared/components/ConfirmButton";
import MuhasebeNav from "@/features/accounting/components/MuhasebeNav";
import CategoryWithInventoryFields from "@/features/accounting/components/CategoryWithInventoryFields";
import { createTransaction, deleteTransaction } from "@/features/accounting/actions";
import { requirePanel } from "@/features/auth/guards";
import { PAYMENT_METHOD_LABEL as METHOD_LABEL } from "@/features/reservations/constants";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  "kayit-eksik": "Başlık, tutar ve hesap seçimi zorunludur.",
};

export default async function IslemYapPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  await requirePanel("muhasebe");
  const now = new Date();
  const [accounts, ledger, inventory] = await Promise.all([getAccounts(), getRecentLedger(10), getInventoryItemsWithStock()]);
  const manualToday = ledger.filter((l) => l.source === "MANUEL");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">İşlem Yap</h1>
      <p className="mt-1 text-sm text-ink-soft">Fatura, kira, bakım-onarım gibi giderleri veya konaklama dışı gelirleri buradan kaydedin.</p>

      <div className="mt-5">
        <MuhasebeNav active="islem" />
      </div>

      {searchParams.ok === "kayit-eklendi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Kayıt eklendi.</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <section className="card mt-5 p-5">
        <p className="mb-4 text-sm text-ink-soft">
          Personel maaşı ödemesi için Personel ekranındaki &quot;Maaş öde&quot; butonunu kullanın — oradan girilenler de
          otomatik burada görünür.
        </p>

        <form action={createTransaction} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-bold">
            Tür
            <select name="type" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="GIDER">Gider</option>
              <option value="GELIR">Gelir (konaklama dışı)</option>
            </select>
          </label>

          <CategoryWithInventoryFields
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            items={inventory.items.map((i) => ({ id: i.id, name: i.name, unit: i.unit }))}
            locations={inventory.locations}
          />

          <label className="text-xs font-bold">
            Tarih
            <input type="date" name="date" defaultValue={toInputDate(now)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <label className="text-xs font-bold sm:col-span-2 xl:col-span-1">
            Başlık / açıklama
            <input name="title" placeholder="Örn. Eylül elektrik faturası" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <label className="text-xs font-bold">
            Tutar (₺)
            <input name="amount" type="number" min={0} step={50} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <label className="text-xs font-bold">
            Ödeme yöntemi
            <select name="method" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="NAKIT">Nakit</option>
              <option value="KART">Kart</option>
              <option value="HAVALE">Havale</option>
            </select>
          </label>

          <label className="text-xs font-bold">
            Hangi hesaptan / hesaba
            <select name="accountId" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold sm:col-span-2 xl:col-span-3">
            Not (isteğe bağlı)
            <input name="note" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <div className="sm:col-span-2 xl:col-span-3">
            <button className="btn-primary">Kaydı ekle</button>
          </div>
        </form>
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Son eklenen kayıtlar</h2>
        {manualToday.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz manuel kayıt eklenmedi.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Açıklama</th>
                <th className="pb-2">Hesap</th>
                <th className="pb-2 text-right">Tutar</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {manualToday.map((l) => (
                <tr key={l.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs">{fmtDate(l.date)}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.type === "GELIR" ? "bg-brand-50 text-brand-600" : "bg-danger-50 text-danger-700"}`}>
                      {l.type === "GELIR" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="py-2.5">{l.title}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{l.accountName}</td>
                  <td className={`py-2.5 text-right font-bold ${l.type === "GELIR" ? "text-brand-600" : "text-danger-500"}`}>
                    {l.type === "GELIR" ? "+" : "−"}
                    {fmtMoney(l.amount)}
                  </td>
                  <td className="py-2.5">
                    <form action={deleteTransaction}>
                      <input type="hidden" name="id" value={l.id.replace("tx-", "")} />
                      <ConfirmButton message="Bu kayıt silinsin mi?" className="text-xs text-ink-soft hover:text-red-700">
                        Sil
                      </ConfirmButton>
                    </form>
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
