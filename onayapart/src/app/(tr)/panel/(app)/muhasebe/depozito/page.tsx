import { prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import StatCard from "@/shared/components/panel/StatCard";
import MuhasebeNav from "@/features/accounting/components/MuhasebeNav";
import SearchBox from "@/shared/components/panel/SearchBox";

export const dynamic = "force-dynamic";

export default async function DepositsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();

  const reservationsAll = await prisma.reservation.findMany({
    where: { deposit: { gt: 0 }, status: { not: "IPTAL" } },
    orderBy: { checkIn: "desc" },
    include: { guest: true, room: true },
  });

  const reservations = q
    ? reservationsAll.filter(
        (r) =>
          r.guest.fullName.toLowerCase().includes(q.toLowerCase()) ||
          r.code.toLowerCase().includes(q.toLowerCase()) ||
          String(r.room.number).includes(q)
      )
    : reservationsAll;

  const totalDeposit = reservationsAll.reduce((s, r) => s + r.deposit, 0);
  const activeCount = reservationsAll.filter((r) => r.status === "GIRIS_YAPTI").length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Depozitolar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Rezervasyon açılırken alınan güvence/depozito bedelleri — müşteri müşteri, hangi rezervasyonda ne kadar
        depozito alındığı burada görünür. Bu tutarlar rezervasyonun toplam bedeline dahil değildir, ayrı takip
        edilir.
      </p>

      <div className="mt-5">
        <MuhasebeNav active="depozito" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Toplam alınan depozito" value={fmtMoney(totalDeposit)} icon="key" tone="brand" note={`${reservationsAll.length} rezervasyonda`} />
        <StatCard label="Şu an odada kalan (depozitolu)" value={String(activeCount)} icon="door" tone="gold" />
      </div>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Müşteri bazında depozitolar</h2>
          <SearchBox placeholder="Müşteri, kod veya oda no ara..." value={q} />
        </div>
        {reservationsAll.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz depozito alınmış bir rezervasyon yok.</p>
        ) : reservations.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen kayıt bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Müşteri</th>
                <th className="pb-2">Rezervasyon</th>
                <th className="pb-2">Daire</th>
                <th className="pb-2">Giriş — Çıkış</th>
                <th className="pb-2">Durum</th>
                <th className="pb-2 text-right">Depozito</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5">
                    <a href={`/panel/musteriler/${r.guestId}`} className="font-semibold text-brand-600 hover:underline">
                      {r.guest.fullName}
                    </a>
                  </td>
                  <td className="py-2.5 text-xs text-ink-soft">{r.code}</td>
                  <td className="py-2.5 text-xs text-ink-soft">Oda {r.room.number}</td>
                  <td className="py-2.5 text-xs text-ink-soft">
                    {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                  </td>
                  <td className="py-2.5 text-xs text-ink-soft">{r.status}</td>
                  <td className="py-2.5 text-right font-bold">{fmtMoney(r.deposit)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line font-bold">
                <td colSpan={5} className="py-2.5 text-right text-xs uppercase text-ink-soft">
                  Toplam ({reservations.length} kayıt)
                </td>
                <td className="py-2.5 text-right">{fmtMoney(reservations.reduce((s, r) => s + r.deposit, 0))}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>
    </div>
  );
}
