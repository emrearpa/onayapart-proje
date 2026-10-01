import { prisma } from "@/shared/lib/db";
import { fmtDate } from "@/shared/lib/dates";
import StatCard from "@/shared/components/panel/StatCard";
import { createStaffTask, addStaffTaskReply, updateStaffTaskStatus } from "@/features/staff/task-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  ACIK: "Açık",
  DEVAM_EDIYOR: "Devam ediyor",
  TAMAMLANDI: "Tamamlandı",
};
const STATUS_STYLE: Record<string, string> = {
  ACIK: "bg-red-50 text-red-700",
  DEVAM_EDIYOR: "bg-gold-50 text-gold-700",
  TAMAMLANDI: "bg-brand-50 text-brand-600",
};

const MESSAGES: Record<string, string> = {
  "gorev-eklendi": "Not/görev eklendi.",
  "yanit-eklendi": "Yanıt eklendi.",
  "durum-guncellendi": "Durum güncellendi.",
};
const ERRORS: Record<string, string> = {
  "gorev-eksik": "Başlık ve not metni zorunludur.",
  "yanit-eksik": "Yanıt metni boş bırakılamaz.",
};

export default async function StaffTaskPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const [tasksAll, employees] = await Promise.all([
    prisma.staffTask.findMany({
      orderBy: { createdAt: "desc" },
      include: { assignedTo: true, replies: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.employee.findMany({ where: { status: "AKTIF" }, orderBy: { fullName: "asc" } }),
  ]);

  const openTasks = tasksAll.filter((t) => t.status !== "TAMAMLANDI");
  const doneTasks = tasksAll.filter((t) => t.status === "TAMAMLANDI");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">İş Takibi</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Kurum içi not ve talimat takibi — bir personele (ya da genel olarak) bir not bırakın, ilgili kişi görüp
        yanıt yazsın, durumunu güncellesin. Oda/rezervasyonla ilgili bakım-onarım talepleri için ayrıca
        &quot;Bakım talepleri&quot; sayfası var, bu sayfa daha genel kurum içi işler için.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok] ?? "Kaydedildi."}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <StatCard label="Açık iş" value={String(openTasks.length)} icon="warning" tone={openTasks.length > 0 ? "gold" : "brand"} />
        <StatCard label="Tamamlanan" value={String(doneTasks.length)} icon="message" tone="brand" />
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni not / görev bırak</h2>
        <form action={createStaffTask} className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Başlık
            <input name="title" placeholder="Örn. 1. kat üst ışık arızası" required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            İlgili personel (isteğe bağlı — boş bırakırsanız genel not olur)
            <select name="assignedToId" defaultValue="" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="">Genel not (kişi seçilmedi)</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Not
            <textarea name="message" rows={3} placeholder="Örn. 1. kat üst koridordaki ışık çalışmıyor, tamir ettirilsin." required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Son tarih (isteğe bağlı, örn. yarına bırakmak için)
            <input name="dueDate" type="date" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="flex items-end">
            <button className="btn-primary w-full">Notu kaydet</button>
          </div>
        </form>
      </section>

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Açık işler ({openTasks.length})</h2>
        {openTasks.length === 0 ? (
          <p className="text-sm text-ink-soft">Açık iş yok.</p>
        ) : (
          <div className="space-y-3">
            {openTasks.map((t) => (
              <details key={t.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[t.status]}`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-xs text-ink-soft">
                    {t.assignedTo ? `→ ${t.assignedTo.fullName}` : "genel"} · {t.createdByLabel} yazdı · {fmtDate(t.createdAt)}
                  </span>
                  {t.dueDate && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Son tarih: {fmtDate(t.dueDate)}
                    </span>
                  )}
                  {t.replies.length > 0 && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {t.replies.length} yanıt
                    </span>
                  )}
                </summary>

                <div className="border-t border-line p-4">
                  <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm">{t.message}</p>

                  {t.replies.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {t.replies.map((r) => (
                        <div key={r.id} className="rounded-lg border border-line p-2.5 text-xs">
                          <div className="mb-1 flex items-center gap-2 font-bold text-ink-soft">
                            <span>{r.authorLabel}</span>
                            <span>·</span>
                            <span>{fmtDate(r.createdAt)}</span>
                          </div>
                          <p>{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={addStaffTaskReply} className="mb-3 flex flex-wrap gap-2">
                    <input type="hidden" name="taskId" value={t.id} />
                    <input
                      name="message"
                      placeholder="Yanıt yaz (örn. bakıldı, parça lazım)"
                      className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-xs"
                    />
                    <button className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-600">
                      Yanıt ekle
                    </button>
                  </form>

                  <form action={updateStaffTaskStatus} className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                    <input type="hidden" name="taskId" value={t.id} />
                    <span className="text-xs font-bold text-ink-soft">Durumu değiştir:</span>
                    {(["ACIK", "DEVAM_EDIYOR", "TAMAMLANDI"] as const).map((s) => (
                      <button
                        key={s}
                        name="status"
                        value={s}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${
                          t.status === s ? STATUS_STYLE[s] + " border-transparent" : "border-line text-ink-soft hover:border-brand-300"
                        }`}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      {doneTasks.length > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Tamamlanan işler ({doneTasks.length})</h2>
          <div className="space-y-2">
            {doneTasks.map((t) => (
              <details key={t.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-xs text-ink-soft">
                    {t.assignedTo ? `→ ${t.assignedTo.fullName}` : "genel"} · {fmtDate(t.createdAt)}
                  </span>
                </summary>
                <div className="border-t border-line p-4">
                  <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm">{t.message}</p>
                  {t.replies.length > 0 && (
                    <div className="space-y-2">
                      {t.replies.map((r) => (
                        <div key={r.id} className="rounded-lg border border-line p-2.5 text-xs">
                          <div className="mb-1 flex items-center gap-2 font-bold text-ink-soft">
                            <span>{r.authorLabel}</span>
                            <span>·</span>
                            <span>{fmtDate(r.createdAt)}</span>
                          </div>
                          <p>{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <form action={updateStaffTaskStatus} className="mt-3">
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="status" value="ACIK" />
                    <button className="text-xs font-bold text-ink-soft hover:text-brand-600">Yeniden aç</button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
