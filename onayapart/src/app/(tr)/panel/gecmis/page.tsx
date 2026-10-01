import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import StatCard from "@/components/panel/StatCard";

export const dynamic = "force-dynamic";

const ACTOR_LABEL: Record<string, string> = { ADMIN: "Admin", STAFF: "Personel", SISTEM: "Sistem" };
const ACTOR_COLOR: Record<string, string> = {
  ADMIN: "bg-violet-50 text-violet-700",
  STAFF: "bg-sky-50 text-sky-700",
  SISTEM: "bg-slate-100 text-slate-600",
};

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: { aktor?: string; kisi?: string };
}) {
  // Hassas bir kayit - "Personel" yetkisi verilmis olsa bile sadece tam admin girer.
  const isFullAdmin =
    Boolean(cookies().get("oa_panel")?.value) && cookies().get("oa_panel")?.value === process.env.PANEL_PASSWORD;
  if (!isFullAdmin) redirect("/panel");

  const where = {
    ...(searchParams.aktor ? { actorType: searchParams.aktor } : {}),
    ...(searchParams.kisi ? { actorLabel: searchParams.kisi } : {}),
  };

  const [logs, todayCount, totalCount, distinctActors] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.activityLog.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.activityLog.count(),
    prisma.activityLog.findMany({
      where: { actorType: "STAFF" },
      select: { actorLabel: true },
      distinct: ["actorLabel"],
      orderBy: { actorLabel: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">İşlem geçmişi</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Kim, ne zaman, hangi hassas işlemi (para, yetki, fiyat, rezervasyon) yaptı — geriye dönük görüntülenir. Her
        kullanıcının kendi kayıtlarını tek tek görmek için aşağıdan kişi seçebilirsiniz.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Bugünkü işlem" value={String(todayCount)} icon="calendar" tone="brand" />
        <StatCard label="Toplam kayıt" value={String(totalCount)} icon="doc" tone="gold" note="son 100 tanesi listelenir" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {[
          ["", "Tümü"],
          ["ADMIN", "Admin"],
          ["STAFF", "Personel"],
        ].map(([value, label]) => (
          <a
            key={value}
            href={value ? `/panel/gecmis?aktor=${value}` : "/panel/gecmis"}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              (searchParams.aktor ?? "") === value && !searchParams.kisi
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-line bg-white text-ink hover:border-brand-300"
            }`}
          >
            {label}
          </a>
        ))}

        {distinctActors.length > 0 && (
          <form method="get" className="ml-auto flex items-center gap-2">
            <select name="kisi" defaultValue={searchParams.kisi ?? ""} className="rounded-full border border-line px-3 py-2 text-sm font-semibold">
              <option value="">Kişiye göre filtrele…</option>
              {distinctActors.map((a) => (
                <option key={a.actorLabel} value={a.actorLabel}>
                  {a.actorLabel}
                </option>
              ))}
            </select>
            <button className="rounded-full border border-brand-600 px-4 py-2 text-sm font-bold text-brand-600">Göster</button>
          </form>
        )}
      </div>

      {searchParams.kisi && (
        <p className="mt-3 text-xs text-ink-soft">
          <b className="font-bold">{searchParams.kisi}</b> adlı kişinin kayıtları gösteriliyor —{" "}
          <a href="/panel/gecmis" className="font-bold text-brand-600 hover:underline">
            filtreyi temizle
          </a>
        </p>
      )}

      <section className="card mt-5 overflow-x-auto p-5">
        {logs.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz kayıt yok.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Kim</th>
                <th className="pb-2">İşlem</th>
                <th className="pb-2">Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs text-ink-soft">{fmtDate(l.createdAt)}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ACTOR_COLOR[l.actorType] ?? "bg-slate-100 text-slate-600"}`}>
                      {l.actorType === "STAFF" ? l.actorLabel : ACTOR_LABEL[l.actorType] ?? l.actorType}
                    </span>
                  </td>
                  <td className="py-2.5 font-semibold">{l.action}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{l.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
