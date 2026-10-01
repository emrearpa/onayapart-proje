import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import { handleLead } from "../actions";
import SearchBox from "@/components/panel/SearchBox";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ searchParams }: { searchParams: { q?: string } }) {
  const leadsAll = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  const q = (searchParams.q ?? "").trim().toLowerCase();
  const leads = q
    ? leadsAll.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.message?.toLowerCase().includes(q) ?? false)
      )
    : leadsAll;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Siteden gelen talepler</h1>
      <p className="mt-1 text-sm text-ink-soft">Formu dolduran ziyaretçiler buraya düşer. Aradıktan sonra kapatın.</p>

      <section className="card mt-5 overflow-x-auto p-5">
        {leadsAll.length > 0 && (
          <div className="mb-4 flex justify-end">
            <SearchBox placeholder="İsim, telefon veya mesaj ara..." value={q} />
          </div>
        )}
        {leadsAll.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz talep yok. Site yayına girdiğinde buraya düşmeye başlayacak.</p>
        ) : leads.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen talep bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Ad</th>
                <th className="pb-2">Telefon</th>
                <th className="pb-2">Oda</th>
                <th className="pb-2">Mesaj</th>
                <th className="pb-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-3 text-xs">{fmtDate(l.createdAt)}</td>
                  <td className="py-3 font-semibold">{l.name}</td>
                  <td className="py-3">
                    <a href={`tel:${l.phone}`} className="text-brand-600">
                      {l.phone}
                    </a>
                  </td>
                  <td className="py-3">{l.roomNumber ?? "—"}</td>
                  <td className="py-3 max-w-[280px] text-ink-soft">{l.message ?? "—"}</td>
                  <td className="py-3">
                    {l.handled ? (
                      <span className="rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-600">
                        Arandı
                      </span>
                    ) : (
                      <form action={handleLead}>
                        <input type="hidden" name="id" value={l.id} />
                        <button className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700">
                          Arandı olarak işaretle
                        </button>
                      </form>
                    )}
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
