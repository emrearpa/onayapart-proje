import { prisma } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import ConfirmButton from "@/components/ConfirmButton";
import StatCard from "@/components/panel/StatCard";
import SearchBox from "@/components/panel/SearchBox";
import { closeTask, reopenTask, createTask, addTaskNote } from "../actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { TEMIZLIK: "Temizlik", BAKIM: "Bakım", ARIZA: "Arıza" };

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const matches = (t: { title: string; room: { number: number }; guest: { fullName: string } | null }) =>
    !q ||
    t.title.toLowerCase().includes(q) ||
    String(t.room.number).includes(q) ||
    (t.guest?.fullName.toLowerCase().includes(q) ?? false);

  const [openTasksAll, closedTasksAll, rooms] = await Promise.all([
    prisma.task.findMany({
      where: { status: "ACIK" },
      orderBy: { createdAt: "asc" },
      include: { room: true, guest: true, notes: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.task.findMany({
      where: { status: "TAMAMLANDI" },
      orderBy: { closedAt: "desc" },
      take: 30,
      include: { room: true, guest: true, notes: { orderBy: { createdAt: "asc" } } },
    }),
    prisma.room.findMany({ orderBy: { number: "asc" } }),
  ]);

  const openTasks = openTasksAll.filter(matches);
  const closedTasks = closedTasksAll.filter(matches);
  const cleaningTasks = openTasksAll.filter((t) => t.kind === "TEMIZLIK");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Bakım ve arıza talepleri</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Müşterilerin kendi panelinden gönderdiği talepler ve sizin buradan girdiğiniz bakım işleri birlikte listelenir.
      </p>

      {cleaningTasks.length > 0 && (
        <section className="card mt-5 overflow-hidden border-sky-200 p-0">
          <div className="flex items-center gap-2 bg-sky-50 px-5 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sky-500 text-white">🧹</span>
            <h2 className="font-extrabold tracking-tight text-sky-900">
              Bugün temizlenecek odalar ({cleaningTasks.length})
            </h2>
          </div>
          <ul className="divide-y divide-sky-100">
            {cleaningTasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <span className="font-extrabold">Oda {t.room.number}</span>
                  {t.guest && <span className="ml-2 text-xs text-ink-soft">· çıkış yapan: {t.guest.fullName}</span>}
                  <div className="text-xs text-ink-soft">{fmtDate(t.createdAt)}</div>
                </div>
                <form action={closeTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="back" value="/panel/bakim-talepleri" />
                  <button className="whitespace-nowrap rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-700">
                    Temizlendi — odayı müsaitliğe al
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Açık talep" value={String(openTasksAll.length)} icon="warning" tone={openTasksAll.length > 0 ? "gold" : "brand"} />
        <StatCard
          label="Müşteri kaynaklı"
          value={String(openTasksAll.filter((t) => t.guest).length)}
          icon="message"
          tone="brand"
          note="kendi panelinden gönderdi"
        />
        <StatCard label="Bu ay tamamlanan" value={String(closedTasksAll.length)} icon="wrench" tone="brand" />
      </div>

      {searchParams.ok === "eklendi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Talep eklendi.</p>
      )}
      {searchParams.ok === "not-eklendi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Not eklendi.</p>
      )}
      {searchParams.ok === "yeniden-acildi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Talep yeniden açıldı.</p>
      )}
      {searchParams.hata === "not-eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Not boş bırakılamaz.</p>
      )}
      {searchParams.hata === "eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Oda ve konu zorunludur.</p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni iş / talep ekle</h2>
        <form action={createTask} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold">
            Daire
            <select name="roomId" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Oda {r.number}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            Tür
            <select name="kind" defaultValue="ARIZA" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="ARIZA">Arıza</option>
              <option value="BAKIM">Bakım</option>
              <option value="TEMIZLIK">Temizlik</option>
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Konu
            <input name="title" placeholder="Örn. Klima arızası" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold sm:col-span-2 xl:col-span-4">
            Detay (isteğe bağlı)
            <textarea name="message" rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2 xl:col-span-4">
            <button className="btn-primary">Ekle</button>
          </div>
        </form>
      </section>

      <section className="card mt-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Açık talepler ({openTasksAll.length})</h2>
          <SearchBox placeholder="Konu, oda no veya müşteri ara..." value={searchParams.q} />
        </div>
        {openTasksAll.length === 0 ? (
          <p className="text-sm text-ink-soft">Açık talep yok.</p>
        ) : openTasks.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen açık talep bulunamadı.</p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((t) => (
              <details key={t.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3">
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                    {KIND_LABEL[t.kind] ?? t.kind}
                  </span>
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-xs text-ink-soft">
                    Oda {t.room.number} · {fmtDate(t.createdAt)}
                  </span>
                  {t.guest && <span className="text-xs text-ink-soft">· Müşteri talebi: {t.guest.fullName}</span>}
                  {t.notes.length > 0 && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                      {t.notes.length} not
                    </span>
                  )}
                </summary>

                <div className="border-t border-line p-4">
                  {t.message && (
                    <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-ink-soft">
                      <b className="font-bold">İlk talep:</b> {t.message}
                    </p>
                  )}

                  {t.notes.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <h3 className="text-xs font-extrabold text-ink-soft">Geçmiş notlar</h3>
                      {t.notes.map((n) => (
                        <div key={n.id} className="rounded-lg border border-line p-2.5 text-xs">
                          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-ink-soft">
                            <span>{n.authorLabel}</span>
                            <span>·</span>
                            <span>{fmtDate(n.createdAt)}</span>
                          </div>
                          <p>{n.note}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form action={addTaskNote} className="mb-3 flex flex-wrap gap-2">
                    <input type="hidden" name="taskId" value={t.id} />
                    <input type="hidden" name="back" value="/panel/bakim-talepleri" />
                    <input
                      name="note"
                      placeholder="İlerleme notu ekle (örn. parça sipariş edildi)"
                      className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-xs"
                    />
                    <button className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-600">
                      Not ekle
                    </button>
                  </form>

                  <form action={closeTask} className="border-t border-line pt-3">
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="back" value="/panel/bakim-talepleri" />
                    <label className="mb-2 block text-xs font-bold">
                      Tamamlandı olarak işaretle — tespit edilen arıza ve yapılan işlemi yazın
                      <textarea
                        name="note"
                        rows={2}
                        placeholder="Örn. Klimanın gazı bitmişti, gaz dolumu yapıldı ve test edildi."
                        className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs"
                      />
                    </label>
                    <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">
                      Tamamlandı işaretle
                    </button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Tamamlanan talepler (son 30)</h2>
        {closedTasksAll.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz tamamlanan talep yok.</p>
        ) : closedTasks.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen tamamlanan talep bulunamadı.</p>
        ) : (
          <div className="space-y-2">
            {closedTasks.map((t) => (
              <details key={t.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="font-semibold">{t.title}</span>
                  <span className="text-xs text-ink-soft">
                    Oda {t.room.number} · {t.closedAt ? fmtDate(t.closedAt) : ""}
                  </span>
                  {t.guest && <span className="text-xs text-ink-soft">· {t.guest.fullName}</span>}
                  {t.notes.length > 0 && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                      {t.notes.length} not
                    </span>
                  )}
                </summary>
                <div className="border-t border-line p-4">
                  {t.message && (
                    <p className="mb-3 rounded-lg bg-slate-50 p-3 text-xs text-ink-soft">
                      <b className="font-bold">İlk talep:</b> {t.message}
                    </p>
                  )}
                  {t.notes.length > 0 ? (
                    <div className="mb-3 space-y-2">
                      {t.notes.map((n) => (
                        <div key={n.id} className="rounded-lg border border-line p-2.5 text-xs">
                          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold text-ink-soft">
                            <span>{n.authorLabel}</span>
                            <span>·</span>
                            <span>{fmtDate(n.createdAt)}</span>
                            {n.kind === "TAMAMLANDI" && (
                              <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] text-brand-600">Kapanış notu</span>
                            )}
                          </div>
                          <p>{n.note}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-ink-soft">Bu talep için not girilmemiş.</p>
                  )}
                  <form action={reopenTask}>
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton
                      message="Bu talep yeniden açılsın mı? Notlar korunur."
                      className="text-xs font-bold text-ink-soft hover:text-brand-600"
                    >
                      Yeniden aç
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
