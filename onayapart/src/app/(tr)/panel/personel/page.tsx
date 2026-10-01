import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getAccounts } from "@/lib/queries";
import { fmtDate, fmtMoney, toInputDate } from "@/lib/dates";
import { createEmployee, updateEmployeeStatus, paySalary } from "./actions";
import SearchBox from "@/components/panel/SearchBox";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  eklendi: "Personel eklendi.",
  guncellendi: "Durum güncellendi.",
  odendi: "Maaş ödemesi kaydedildi.",
};
const ERRORS: Record<string, string> = {
  eksik: "Ad soyad ve pozisyon zorunludur.",
  "odeme-eksik": "Tutar ve hesap seçimi zorunludur.",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [employees, accounts] = await Promise.all([
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      include: { transactions: { orderBy: { date: "desc" }, take: 6 } },
    }),
    getAccounts(),
  ]);

  const now = new Date();
  const cookieStore = cookies();
  const isFullAdmin =
    Boolean(cookieStore.get("oa_panel")?.value) && cookieStore.get("oa_panel")?.value === process.env.PANEL_PASSWORD;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Personel</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Çalışanlarınızı kaydedin, maaş ödemelerini buradan girin — her ödeme otomatik olarak Ön Muhasebe defterinde
        gider olarak görünür.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok]}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni personel ekle</h2>
        <form action={createEmployee} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold">
            Ad Soyad
            <input name="fullName" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Pozisyon
            <input name="position" placeholder="Örn. Resepsiyon" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Telefon
            <input name="phone" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Aylık maaş (₺)
            <input name="salary" type="number" min={0} step={100} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            İşe başlama tarihi
            <input type="date" name="startDate" defaultValue={toInputDate(now)} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="flex items-end">
            <button className="btn-primary w-full">Personeli ekle</button>
          </div>
        </form>
      </section>

      <section className="mt-5 space-y-4">
        <SearchBox placeholder="Ad soyad veya pozisyon ara..." value={q} />
        {(() => {
          const visibleEmployees = q
            ? employees.filter((e) => e.fullName.toLowerCase().includes(q) || e.position.toLowerCase().includes(q))
            : employees;
          if (employees.length === 0) return <p className="text-sm text-ink-soft">Henüz personel kaydı yok.</p>;
          if (visibleEmployees.length === 0) return <p className="text-sm text-ink-soft">Aramanızla eşleşen personel bulunamadı.</p>;
          return visibleEmployees.map((e) => (
            <details key={e.id} className="card p-5">
              <summary className="flex cursor-pointer flex-wrap items-center gap-3 font-bold">
                <span className="font-extrabold tracking-tight">{e.fullName}</span>
                <span className="text-xs font-normal text-ink-soft">{e.position}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    e.status === "AKTIF" ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {e.status === "AKTIF" ? "Aktif" : "Ayrıldı"}
                </span>
                <span className="ml-auto text-xs font-normal text-ink-soft">Maaş: {fmtMoney(e.salary)}</span>
              </summary>

              <div className="mb-4 mt-1">
                {isFullAdmin ? (
                  <Link href={`/panel/personel/${e.id}`} className="text-xs font-bold text-brand-600 hover:underline">
                    Detay / Özlük dosyası / Kullanıcı yetkisi →
                  </Link>
                ) : (
                  <span className="text-xs text-ink-soft">Özlük dosyası ve kullanıcı yetkisi yalnızca admin girişiyle görülebilir.</span>
                )}
              </div>

              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-extrabold">Maaş öde</h3>
                  <form action={paySalary} className="grid gap-2">
                    <input type="hidden" name="employeeId" value={e.id} />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="amount"
                        type="number"
                        min={0}
                        step={50}
                        defaultValue={e.salary || undefined}
                        placeholder="Tutar (₺)"
                        className="rounded-lg border border-line px-3 py-2 text-sm"
                      />
                      <input type="date" name="date" defaultValue={toInputDate(now)} className="rounded-lg border border-line px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select name="method" className="rounded-lg border border-line px-3 py-2 text-sm">
                        <option value="HAVALE">Havale</option>
                        <option value="NAKIT">Nakit</option>
                        <option value="KART">Kart</option>
                      </select>
                      <select name="accountId" className="rounded-lg border border-line px-3 py-2 text-sm">
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input name="note" placeholder="Not (isteğe bağlı, örn. Eylül maaşı)" className="rounded-lg border border-line px-3 py-2 text-sm" />
                    <button className="btn-primary">Ödemeyi kaydet</button>
                  </form>

                  <form action={updateEmployeeStatus} className="mt-3">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="status" value={e.status === "AKTIF" ? "AYRILDI" : "AKTIF"} />
                    <button className="text-xs font-bold text-ink-soft hover:text-brand-600">
                      {e.status === "AKTIF" ? "Ayrıldı olarak işaretle" : "Yeniden aktif et"}
                    </button>
                  </form>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-extrabold">Son ödemeler</h3>
                  {e.transactions.length === 0 ? (
                    <p className="text-sm text-ink-soft">Henüz ödeme kaydı yok.</p>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {e.transactions.map((t) => (
                        <li key={t.id} className="flex justify-between border-b border-line pb-1.5">
                          <span className="text-ink-soft">{fmtDate(t.date)}</span>
                          <span className="font-bold">{fmtMoney(t.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </details>
          ));
        })()}
      </section>
    </div>
  );
}
