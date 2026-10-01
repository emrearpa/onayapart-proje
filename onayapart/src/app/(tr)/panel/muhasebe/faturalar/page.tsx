import { prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import StatCard from "@/shared/components/panel/StatCard";
import MuhasebeNav from "@/features/accounting/components/MuhasebeNav";
import SearchBox from "@/shared/components/panel/SearchBox";
import { markInvoiceIssued, markInvoicePending, createManualInvoiceRequest } from "@/features/accounting/actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  kesildi: "Fatura kesildi olarak işaretlendi.",
  "geri-alindi": "Bekliyor durumuna geri alındı.",
  "talep-acildi": "Yeni fatura talebi açıldı.",
};
const ERRORS: Record<string, string> = {
  "numara-eksik": "Fatura numarası zorunludur.",
  bulunamadi: "Rezervasyon bulunamadı.",
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const [pendingInvoices, issuedInvoices, reservationsAll] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "BEKLIYOR" },
      orderBy: { createdAt: "asc" },
      include: { reservation: { include: { guest: true, room: true } }, payment: true },
    }),
    prisma.invoice.findMany({
      where: { status: "KESILDI" },
      orderBy: { issuedAt: "desc" },
      take: 30,
      include: { reservation: { include: { guest: true, room: true } }, payment: true },
    }),
    prisma.reservation.findMany({
      where: { status: { in: ["ONAYLI", "GIRIS_YAPTI", "TAMAMLANDI"] } },
      orderBy: { checkIn: "desc" },
      take: 100,
      include: { guest: true, room: true, invoices: true },
    }),
  ]);

  const reservations = q
    ? reservationsAll.filter(
        (r) =>
          r.guest.fullName.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          String(r.room.number).includes(q)
      )
    : reservationsAll;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Faturalar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Şirketiniz Uyumsoft ile çalışıyor. Otomatik bağlantı için Uyumsoft&apos;un web servis kullanıcı bilgilerini ve
        entegrasyon dokümanını (WSDL) bekliyoruz — o gelene kadar faturayı Uyumsoft portalinden kesip numarasını
        buraya işleyin, düzenli bir takip listeniz olsun. Nakit ödeme alırken &quot;Fatura kesilsin mi?&quot;
        sorusuna evet denirse (Rezervasyonlar sayfasında) talep otomatik olarak buraya düşer.
      </p>

      <div className="mt-5">
        <MuhasebeNav active="faturalar" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href="https://efatura.uyumsoft.com.tr" target="_blank" rel="noopener" className="btn-outline">
          Uyumsoft portalına git →
        </a>
      </div>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok] ?? "Kaydedildi."}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Bekleyen fatura talebi" value={String(pendingInvoices.length)} icon="warning" tone={pendingInvoices.length > 0 ? "gold" : "brand"} />
        <StatCard label="Kesilmiş fatura (son 30)" value={String(issuedInvoices.length)} icon="doc" tone="brand" />
      </div>

      {/* BEKLEYEN TALEPLER */}
      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Bekleyen fatura talepleri</h2>
        {pendingInvoices.length === 0 ? (
          <p className="text-sm text-ink-soft">Bekleyen fatura talebi yok.</p>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Rezervasyon</th>
                <th className="pb-2">Müşteri</th>
                <th className="pb-2">Tutar</th>
                <th className="pb-2">Kaynak</th>
                <th className="pb-2">Fatura no</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-line">
                  <td className="py-2.5 font-semibold">
                    {inv.reservation.code}
                    <div className="text-xs font-normal text-ink-soft">Oda {inv.reservation.room.number}</div>
                    {inv.reservation.billToCompany && (
                      <span className="mt-0.5 inline-block rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        {inv.reservation.companyName || "Kurumsal"}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">{inv.reservation.guest.fullName}</td>
                  <td className="py-2.5 font-bold">{fmtMoney(inv.amount ?? 0)}</td>
                  <td className="py-2.5 text-xs text-ink-soft">
                    {inv.payment ? `Nakit ödeme · ${fmtDate(inv.payment.paidAt)}` : "Elle eklendi"}
                    {inv.note && <div className="italic">{inv.note}</div>}
                  </td>
                  <td className="py-2.5">
                    <form action={markInvoiceIssued} className="flex items-center gap-1.5">
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <input name="invoiceNumber" placeholder="Fatura no" className="w-28 rounded-lg border border-line px-2 py-1.5 text-xs" />
                      <button className="whitespace-nowrap rounded-lg bg-brand-600 px-2.5 py-1.5 text-[11px] font-bold text-white">
                        Kaydet
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* KESİLMİŞ FATURALAR */}
      {issuedInvoices.length > 0 && (
        <section className="card mt-5 overflow-x-auto p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Son kesilen faturalar</h2>
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Rezervasyon</th>
                <th className="pb-2">Müşteri</th>
                <th className="pb-2">Tutar</th>
                <th className="pb-2">Fatura no</th>
                <th className="pb-2">Tarih</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {issuedInvoices.map((inv) => (
                <tr key={inv.id} className="border-t border-line">
                  <td className="py-2.5 font-semibold">{inv.reservation.code}</td>
                  <td className="py-2.5">{inv.reservation.guest.fullName}</td>
                  <td className="py-2.5">{fmtMoney(inv.amount ?? 0)}</td>
                  <td className="py-2.5">{inv.invoiceNumber}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{inv.issuedAt ? fmtDate(inv.issuedAt) : "—"}</td>
                  <td className="py-2.5">
                    <form action={markInvoicePending}>
                      <input type="hidden" name="invoiceId" value={inv.id} />
                      <button className="text-xs font-bold text-ink-soft hover:text-red-700">Geri al</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* REZERVASYONLAR - yeni talep acma */}
      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Son 100 rezervasyon</h2>
          <SearchBox placeholder="Müşteri, kod veya oda no ara..." value={q} />
        </div>
        {reservations.length === 0 ? (
          <p className="text-sm text-ink-soft">{q ? "Aramanızla eşleşen kayıt bulunamadı." : "Henüz rezervasyon yok."}</p>
        ) : (
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Kod</th>
                <th className="pb-2">Müşteri</th>
                <th className="pb-2">Daire</th>
                <th className="pb-2">Tutar</th>
                <th className="pb-2">Fatura durumu</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const pending = r.invoices.filter((i) => i.status === "BEKLIYOR").length;
                const issued = r.invoices.filter((i) => i.status === "KESILDI").length;
                return (
                  <tr key={r.id} className="border-t border-line transition hover:bg-brand-50/30">
                    <td className="py-2.5 font-semibold">{r.code}</td>
                    <td className="py-2.5">{r.guest.fullName}</td>
                    <td className="py-2.5 text-xs text-ink-soft">Oda {r.room.number}</td>
                    <td className="py-2.5">{fmtMoney(r.totalAmount)}</td>
                    <td className="py-2.5 text-xs">
                      {pending > 0 && <span className="mr-1 rounded-full bg-gold-50 px-2 py-0.5 font-bold text-gold-700">{pending} bekliyor</span>}
                      {issued > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-600">{issued} kesildi</span>}
                      {pending === 0 && issued === 0 && <span className="text-ink-soft">Talep yok</span>}
                    </td>
                    <td className="py-2.5">
                      <form action={createManualInvoiceRequest} className="flex items-center gap-1.5">
                        <input type="hidden" name="reservationId" value={r.id} />
                        <input
                          name="amount"
                          type="number"
                          min={0}
                          step={50}
                          placeholder="Tutar (bos = tamami)"
                          className="w-32 rounded-lg border border-line px-2 py-1.5 text-xs"
                        />
                        <button className="whitespace-nowrap rounded-lg border border-brand-600 px-2.5 py-1.5 text-[11px] font-bold text-brand-600">
                          + Talep aç
                        </button>
                      </form>
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
