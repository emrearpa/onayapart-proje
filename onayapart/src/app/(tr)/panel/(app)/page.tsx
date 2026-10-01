import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { getDashboard, buildCalendar } from "@/features/dashboard/queries";
import { getUpcomingPayments } from "@/features/reservations/queries";
import { getDailyRevenue } from "@/features/accounting/queries";
import { availabilityOf, availabilityLabel } from "@/features/rooms/availability";
import StatusBadge from "@/features/rooms/components/StatusBadge";
import { fmtMoney, fmtDate } from "@/shared/lib/dates";
import { toggleKbs } from "@/features/reservations/actions";
import { closeTask } from "@/features/maintenance/actions";
import { sendRoomInfoWhatsapp } from "@/features/rooms/actions";
import StatCard from "@/shared/components/panel/StatCard";
import Icon from "@/shared/components/panel/Icon";
import RevenueTrendChart from "@/features/accounting/components/charts/RevenueTrendChart";
import DraggableCalendar from "@/features/reservations/components/DraggableCalendar";

export const dynamic = "force-dynamic";

export default async function PanelHome({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const { rooms, reservations, externalBookings, leads, openTasks, kpi, today, days } = await getDashboard(14);
  const pendingOrders = await prisma.roomServiceCharge.findMany({
    where: { status: "BEKLIYOR" },
    orderBy: { createdAt: "asc" },
    include: { reservation: { include: { guest: true, room: true } } },
  });

  // Her odanin SU ANKI (bugunku) durumu - gosterge panelinde hemen goruntulenebilsin diye.
  const roomStatuses = rooms.map((room) => ({
    room,
    state: availabilityOf(
      room.condition,
      reservations.filter((r) => r.roomId === room.id),
      today,
      externalBookings.filter((e) => e.roomId === room.id)
    ),
  }));
  const occupiedNow = roomStatuses.filter((r) => r.state === "DOLU" || r.state === "HARICI").length;

  // Oda tipine gore grupluyoruz (1+0, 1+1, 2+1 gibi) - her tip kendi sutununda,
  // musait odalar ustte alt alta siralaniyor.
  type StatusTypeGroup = { typeId: string; typeCode: string; typeName: string; rooms: typeof roomStatuses };
  const groupsByType: Record<string, StatusTypeGroup> = {};
  for (const rs of roomStatuses) {
    const key = rs.room.type.id;
    if (!groupsByType[key]) {
      groupsByType[key] = { typeId: key, typeCode: rs.room.type.code, typeName: rs.room.type.name, rooms: [] };
    }
    groupsByType[key].rooms.push(rs);
  }
  const statusTypeGroups: StatusTypeGroup[] = Object.values(groupsByType).sort((a, b) => a.typeCode.localeCompare(b.typeCode));
  const [upcomingPayments, revenueTrend] = await Promise.all([getUpcomingPayments(5), getDailyRevenue(14)]);

  // Takvimi tek uzun tablo yerine oda tipine gore ayri, katlanir bolumlere ayiriyoruz.
  const typeGroups = new Map<string, { type: (typeof rooms)[number]["type"]; rooms: typeof rooms }>();
  for (const r of rooms) {
    const key = r.type.id;
    if (!typeGroups.has(key)) typeGroups.set(key, { type: r.type, rooms: [] });
    typeGroups.get(key)!.rooms.push(r);
  }
  const calendarGroups = Array.from(typeGroups.values())
    .sort((a, b) => a.type.sort - b.type.sort)
    .map((g) => ({
      type: g.type,
      roomCount: g.rooms.length,
      calendar: buildCalendar(g.rooms, reservations, today, days, externalBookings),
    }));

  const last7 = revenueTrend.slice(-7).reduce((s, d) => s + d.amount, 0);
  const prev7 = revenueTrend.slice(-14, -7).reduce((s, d) => s + d.amount, 0);
  const revenueTrendPct = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

  return (
    <div>
      {searchParams.ok === "wa-gonderildi" && (
        <p className="mb-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Oda bilgisi WhatsApp&apos;tan gönderildi.
        </p>
      )}
      {searchParams.hata && (
        <p className="mb-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {searchParams.hata === "telefon-eksik"
            ? "Bir telefon numarası girin."
            : searchParams.hata === "oda-bulunamadi"
              ? "Oda bulunamadı."
              : "WhatsApp mesajı gönderilemedi."}
        </p>
      )}
      {/* BASLIK BANDI */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl bg-gradient-to-r from-brand-900 via-brand-800 to-brand-700 px-5 py-4 text-white">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Gösterge paneli</h1>
          <p className="text-sm text-brand-200">{fmtDate(today)} · Onay Apart Rezidans</p>
        </div>
        <Link
          href="/panel/rezervasyonlar"
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-800 transition hover:bg-brand-50"
        >
          <Icon name="arrival" className="h-4 w-4" />
          Yeni rezervasyon
        </Link>
      </div>

      {/* ACIK BAKIM/ARIZA BILDIRIMI - varsa en ustte, bildirim tarzinda */}
      {openTasks.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-100/60 px-5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500 text-white">
              <Icon name="warning" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-extrabold tracking-tight text-amber-900">
                {openTasks.length} açık bakım/arıza talebi var
              </h2>
              <p className="text-xs text-amber-700">Aşağıdan hızlıca tamamlandı işaretleyebilir, detaylı not için tam sayfaya geçebilirsiniz.</p>
            </div>
            <Link href="/panel/bakim-talepleri" className="ml-auto shrink-0 text-xs font-bold text-amber-800 hover:underline">
              Tümünü gör →
            </Link>
          </div>
          <ul className="divide-y divide-amber-200/70">
            {openTasks.slice(0, 4).map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <span
                    className={`mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      t.kind === "TEMIZLIK" ? "bg-sky-100 text-sky-700" : t.kind === "ARIZA" ? "bg-danger-200 text-danger-700" : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {t.kind === "TEMIZLIK" ? "Temizlik" : t.kind === "ARIZA" ? "Arıza" : "Bakım"}
                  </span>
                  <span className="font-semibold">{t.title}</span>
                  <span className="ml-2 text-xs text-ink-soft">
                    Oda {t.room.number}
                    {t.guest && <> · {t.guest.fullName}</>}
                  </span>
                </div>
                <form action={closeTask}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="back" value="/panel" />
                  <button className="whitespace-nowrap rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-amber-800 transition hover:bg-amber-100">
                    {t.kind === "TEMIZLIK" ? "Temizlendi" : "Tamamlandı işaretle"}
                  </button>
                </form>
              </li>
            ))}
          </ul>
          {openTasks.length > 4 && (
            <div className="border-t border-amber-200/70 px-5 py-2.5 text-center">
              <Link href="/panel/bakim-talepleri" className="text-xs font-bold text-amber-800 hover:underline">
                +{openTasks.length - 4} tane daha →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* BEKLEYEN MISAFIR SIPARISLERI - varsa bildirim tarzinda */}
      {pendingOrders.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-violet-200 bg-violet-50">
          <div className="flex items-center gap-3 border-b border-violet-200 bg-violet-100/60 px-5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-violet-500 text-white">
              <Icon name="message" className="h-5 w-5" />
            </span>
            <h2 className="font-extrabold tracking-tight text-violet-900">
              {pendingOrders.length} onay bekleyen misafir siparişi var
            </h2>
          </div>
          <ul className="divide-y divide-violet-200/70">
            {pendingOrders.slice(0, 4).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <div>
                  <span className="font-semibold">
                    {o.name} × {o.quantity}
                  </span>
                  <span className="ml-2 text-xs text-ink-soft">
                    Oda {o.reservation.room.number} · {o.reservation.guest.fullName}
                  </span>
                </div>
                <Link
                  href={`/panel/musteriler/${o.reservation.guestId}`}
                  className="whitespace-nowrap rounded-lg border border-violet-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-violet-800 transition hover:bg-violet-100"
                >
                  İncele ve onayla
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* KPI SERIDI */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Doluluk oranı"
          value={`%${kpi.occupancy}`}
          icon="occupancy"
          tone="brand"
          note={`${kpi.occupiedToday}/${kpi.totalRooms} daire dolu`}
        />
        <StatCard label="Bugün giriş" value={String(kpi.arrivals)} icon="arrival" tone="brand" note="planlanan" />
        <StatCard label="Bugün çıkış" value={String(kpi.departures)} icon="departure" tone="gold" note="temizliğe alınacak" />
        <StatCard
          label="Bu ay tahsilat"
          value={fmtMoney(kpi.monthRevenue)}
          icon="cash"
          tone="brand"
          trend={revenueTrendPct}
          note="son 7 gün / önceki 7 gün"
        />
        <StatCard label="Tahsil edilmemiş" value={fmtMoney(kpi.receivable)} icon="receipt" tone="danger" note="toplam açık bakiye" />
        <StatCard
          label="Tahsilat gereken"
          value={String(upcomingPayments.length)}
          icon="warning"
          tone={upcomingPayments.length > 0 ? "gold" : "brand"}
          note={upcomingPayments.length > 0 ? "müşteri bekliyor" : "bekleyen yok"}
        />
      </div>

      {/* GELIR TRENDI - HERO GRAFIK */}
      <section className="card mt-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold tracking-tight">Gelir trendi — son 14 gün</h2>
            <p className="text-sm text-ink-soft">Rezervasyon tahsilatları ve diğer gelirler birlikte.</p>
          </div>
          <Link href="/panel/muhasebe" className="text-xs font-bold text-brand-600">
            Ön Muhasebe'ye git →
          </Link>
        </div>
        <div className="mt-3">
          <RevenueTrendChart data={revenueTrend} />
        </div>
      </section>

      {/* ANLIK ODA DURUMU */}
      <section className="card mt-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-extrabold tracking-tight">Odaların şu anki durumu</h2>
            <p className="text-xs text-ink-soft">
              {occupiedNow} / {rooms.length} daire şu an dolu. Aşağıdaki 14 günlük takvim ileri tarihleri gösterir, bu
              bölüm ise sadece bugünü.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {statusTypeGroups.map((group) => {
            const groupAvailable = group.rooms.filter((rs) => rs.state === "MUSAIT");
            const groupBusy = group.rooms.filter((rs) => rs.state !== "MUSAIT");
            return (
              <div key={group.typeId} className="rounded-xl border border-line p-4">
                <h3 className="mb-3 font-extrabold tracking-tight">
                  {group.typeCode} <span className="font-normal text-ink-soft">— {group.typeName}</span>
                </h3>

                <p className="mb-2 text-[11px] font-bold uppercase text-brand-600">
                  🟢 Müsait ({groupAvailable.length})
                </p>
                {groupAvailable.length === 0 ? (
                  <p className="mb-3 text-xs text-ink-soft">Bu tipte müsait daire yok.</p>
                ) : (
                  <div className="mb-3 space-y-2">
                    {groupAvailable.map(({ room }) => (
                      <div key={room.id} className="rounded-lg border border-brand-300 bg-brand-50/40 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold">Oda {room.number}</span>
                          <span className="text-[11px] text-ink-soft">
                            {room.view || "Cephe girilmemiş"} · {room.m2} m² · {room.type.capacity}
                          </span>
                        </div>
                        <form action={sendRoomInfoWhatsapp} target="_blank" className="mt-1.5 flex items-center gap-1">
                          <input type="hidden" name="roomId" value={room.id} />
                          <input type="hidden" name="back" value="/panel" />
                          <input
                            name="phone"
                            type="tel"
                            placeholder="Telefon"
                            className="w-full min-w-0 rounded-lg border border-line px-2 py-1.5 text-xs"
                          />
                          <button className="shrink-0 whitespace-nowrap rounded-lg bg-[#1f9d55] px-2 py-1.5 text-[11px] font-bold text-white">
                            💬
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}

                {groupBusy.length > 0 && (
                  <>
                    <p className="mb-2 border-t border-line pt-3 text-[11px] font-bold uppercase text-ink-soft">
                      Dolu / meşgul ({groupBusy.length})
                    </p>
                    <div className="space-y-2">
                      {groupBusy.map(({ room, state }) => (
                        <div key={room.id} className="rounded-lg border border-line p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold">Oda {room.number}</span>
                            <StatusBadge state={state} />
                          </div>
                          <div className="mt-0.5 text-[11px] text-ink-soft">
                            {room.view || "Cephe girilmemiş"} · {room.m2} m² · {room.type.capacity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 border-t border-line pt-3 text-[11px] text-ink-soft">
          {(["MUSAIT", "DOLU", "HARICI", "TEMIZLIK", "BAKIM"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <StatusBadge state={s} /> {availabilityLabel[s]}
            </span>
          ))}
        </div>
      </section>

      {/* ODA DURUM TAKVIMI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Oda durum takvimi — 14 gün</h2>
        <p className="mb-4 text-sm text-ink-soft">Bir oda tipine tıklayın, o tipteki dairelerin takvimi açılsın.</p>

        <div className="space-y-2">
          {calendarGroups.map((g) => (
            <details key={g.type.id} className="overflow-hidden rounded-xl border border-line">
              <summary className="flex cursor-pointer items-center gap-3 border-l-4 border-brand-500 bg-brand-50/40 px-4 py-3 font-bold">
                <span className="font-extrabold tracking-tight">{g.type.name}</span>
                <span className="text-xs font-normal text-ink-soft">{g.roomCount} daire</span>
                <span className="ml-auto text-xs font-bold text-brand-600">Takvimi göster</span>
              </summary>

              <div className="overflow-x-auto p-4">
                <DraggableCalendar rows={g.calendar} days={days} />
              </div>
            </details>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-soft">
          {[
            ["bg-brand-600", "Dolu / rezerve"],
            ["bg-violet-500", "Booking.com / Airbnb"],
            ["bg-gold-200", "Temizlik"],
            ["bg-danger-200", "Bakım"],
            ["bg-white border border-line", "Müsait"],
          ].map(([cls, label]) => (
            <span key={label} className="flex items-center gap-2">
              <i className={`inline-block h-3 w-3 rounded ${cls}`} /> {label}
            </span>
          ))}
        </div>
      </section>

      {/* TAHSILAT UYARISI */}
      {upcomingPayments.length > 0 && (
        <section className="card mt-5 overflow-hidden border-gold-200 p-0">
          <div className="flex items-center gap-2 bg-gold-50 px-5 py-3">
            <Icon name="warning" className="h-[18px] w-[18px] text-gold-700" />
            <h2 className="font-extrabold tracking-tight text-gold-700">Tahsilat gereken müşteriler</h2>
          </div>
          <div className="p-5 pt-4">
            <p className="mb-4 text-sm text-ink-soft">
              Aylık/dönemlik/yıllık konaklaması olan ve ödeme günü yaklaşan veya geçen müşteriler. Ödeme alındığında
              Rezervasyonlar ekranından tahsilatı kaydedin, ya da Bilgilendirme'den hatırlatma gönderin.
            </p>
            <ul className="space-y-2">
              {upcomingPayments.map((p) => {
                const overdue = p.dueDate < today;
                return (
                  <li key={p.reservation.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3 transition hover:border-gold-200 hover:bg-gold-50/30">
                    <div>
                      <div className="font-semibold">
                        {p.guest.fullName} <span className="font-normal text-ink-soft">· Oda {p.room.number}</span>
                        {p.reservation.stayType === "YILLIK" && (
                          <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                            Yıllık taksit
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-soft">
                        {p.guest.phone} · Ödeme günü: {fmtDate(p.dueDate)}
                        {overdue && <span className="ml-1 font-bold text-danger-500">(gecikti)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-bold text-danger-500">{fmtMoney(p.amount)}</span>
                      <Link href="/panel/rezervasyonlar" className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700">
                        Tahsilat gir
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <section className="card overflow-x-auto p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Yaklaşan rezervasyonlar</h2>
          {reservations.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Kayıtlı rezervasyon yok. Rezervasyonlar ekranından ilk kaydı oluşturun.
            </p>
          ) : (
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-ink-soft">
                  <th className="pb-2">Kod</th>
                  <th className="pb-2">Misafir</th>
                  <th className="pb-2">Daire</th>
                  <th className="pb-2">Giriş</th>
                  <th className="pb-2">Çıkış</th>
                  <th className="pb-2">KBS</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id} className="border-t border-line transition hover:bg-brand-50/30">
                    <td className="py-2.5 font-semibold">{r.code}</td>
                    <td className="py-2.5">{r.guest.fullName}</td>
                    <td className="py-2.5">{r.room.number}</td>
                    <td className="py-2.5">{fmtDate(r.checkIn)}</td>
                    <td className="py-2.5">{fmtDate(r.checkOut)}</td>
                    <td className="py-2.5">
                      <form action={toggleKbs}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="value" value={String(!r.kbsReported)} />
                        <button
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                            r.kbsReported ? "bg-brand-50 text-brand-600" : "bg-gold-50 text-gold-700"
                          }`}
                        >
                          {r.kbsReported ? "Bildirildi" : "Bekliyor"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-5">
          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Icon name="users" className="h-4 w-4 text-brand-600" />
              <h2 className="font-extrabold tracking-tight">Kimlik bildirimi</h2>
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Bekleyen bildirim: <b className="text-ink">{kpi.pendingKbs} misafir</b>. Giriş yapan misafirlerin bildirimi
              yasal süre içinde yapılmalıdır.
            </p>
            <a
              href="https://kbs.pol.tr"
              target="_blank"
              rel="noopener"
              className="mt-3 inline-block text-xs font-bold text-brand-600 hover:underline"
            >
              KBS portalına git (manuel giriş) →
            </a>
          </section>

          <section className="card p-5">
            <div className="flex items-center gap-2">
              <Icon name="message" className="h-4 w-4 text-brand-600" />
              <h2 className="font-extrabold tracking-tight">Siteden gelen talepler</h2>
            </div>
            {leads.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Bekleyen talep yok.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {leads.map((l) => (
                  <li key={l.id} className="border-b border-line pb-2">
                    <b>{l.name}</b> — {l.phone}
                    {l.roomNumber ? <span className="text-ink-soft"> · Oda {l.roomNumber}</span> : null}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/panel/talepler" className="mt-3 inline-block text-sm font-bold text-brand-600">
              Tümünü görün
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
