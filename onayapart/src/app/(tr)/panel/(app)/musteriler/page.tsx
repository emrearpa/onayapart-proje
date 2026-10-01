import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { fmtMoney, fmtDate } from "@/shared/lib/dates";
import StatCard from "@/shared/components/panel/StatCard";
import SearchBox from "@/shared/components/panel/SearchBox";
import { requirePanel } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

export default async function GuestsPage({ searchParams }: { searchParams: { q?: string } }) {
  await requirePanel("musteriler");
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const guests = await prisma.guest.findMany({
    orderBy: { createdAt: "desc" },
    include: { reservations: { include: { payments: true } } },
  });

  const balances = guests.map((g) =>
    g.reservations
      .filter((r) => r.status !== "IPTAL")
      .reduce((s, r) => s + Math.max(0, r.totalAmount - r.payments.reduce((a, p) => a + p.amount, 0)), 0)
  );
  const totalBalance = balances.reduce((s, b) => s + b, 0);
  const debtorCount = balances.filter((b) => b > 0).length;
  const totalStays = guests.reduce((s, g) => s + g.reservations.length, 0);

  const filteredIndexes = guests
    .map((g, i) => i)
    .filter((i) => !q || guests[i].fullName.toLowerCase().includes(q) || guests[i].phone.toLowerCase().includes(q));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Müşteriler</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Her müşterinin geçmiş ve güncel konaklamaları, borç durumu ve müşteri paneline giriş kodu burada.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Toplam müşteri" value={String(guests.length)} icon="users" tone="brand" note={`${totalStays} konaklama`} />
        <StatCard label="Borcu olan müşteri" value={String(debtorCount)} icon="warning" tone={debtorCount > 0 ? "gold" : "brand"} />
        <StatCard label="Toplam açık bakiye" value={fmtMoney(totalBalance)} icon="receipt" tone={totalBalance > 0 ? "danger" : "brand"} />
      </div>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex justify-end">
          <SearchBox placeholder="İsim veya telefon ara..." value={searchParams.q} />
        </div>
        {guests.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz kayıtlı müşteri yok. İlk kayıt, rezervasyon oluşturduğunuzda eklenir.</p>
        ) : filteredIndexes.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen müşteri bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Ad Soyad</th>
                <th className="pb-2">Telefon</th>
                <th className="pb-2">Kayıt tarihi</th>
                <th className="pb-2">Konaklama sayısı</th>
                <th className="pb-2">Toplam bakiye</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredIndexes.map((i) => {
                const g = guests[i];
                const balance = balances[i];
                return (
                  <tr key={g.id} className="border-t border-line transition hover:bg-brand-50/30">
                    <td className="py-3 font-semibold">{g.fullName}</td>
                    <td className="py-3">{g.phone}</td>
                    <td className="py-3 text-xs text-ink-soft">{fmtDate(g.createdAt)}</td>
                    <td className="py-3">{g.reservations.length}</td>
                    <td className="py-3">
                      {balance > 0 ? (
                        <span className="font-bold text-danger-500">{fmtMoney(balance)}</span>
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Link href={`/panel/musteriler/${g.id}`} className="text-xs font-bold text-brand-600 hover:underline">
                        Detay
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
