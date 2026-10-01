import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";
import { createGuestRequest, startOnlinePayment, createGuestRoomServiceOrder } from "@/features/guests/portal-actions";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { getMenu } from "@/features/menu/queries";

export const dynamic = "force-dynamic";

const STAY_LABEL: Record<string, string> = {
  GUNLUK: "Günlük",
  HAFTALIK: "Haftalık",
  AYLIK: "Aylık",
  DONEMLIK: "Öğrenci dönemlik",
  YILLIK: "Yıllık",
  KURUMSAL: "Kurumsal",
};
const RES_STATUS_LABEL: Record<string, string> = {
  OPSIYON: "Opsiyon",
  ONAYLI: "Onaylı",
  GIRIS_YAPTI: "Giriş yaptı",
  TAMAMLANDI: "Çıkış Yaptı",
  IPTAL: "İptal",
};

const ERRORS: Record<string, string> = {
  eksik: "Konu ve daire seçimi zorunludur.",
  yetkisiz: "Seçilen daire kayıtlarınızla eşleşmiyor.",
  "odeme-kapali": "Online ödeme şu an aktif değil. Lütfen işletmeyle iletişime geçin.",
  "borc-yok": "Bu rezervasyonda ödenecek bir bakiye görünmüyor.",
  "bilgi-eksik": "Online ödeme için e-posta ve T.C. kimlik bilginizin sistemde kayıtlı olması gerekiyor. Lütfen işletmeyle iletişime geçin.",
  "odeme-baslamadi": "Ödeme başlatılamadı, lütfen tekrar deneyin.",
  "odeme-basarisiz": "Ödemeniz tamamlanamadı. Kartınızı kontrol edip tekrar deneyebilirsiniz.",
  "odeme-token-yok": "Ödeme bilgisi eksik geldi, lütfen tekrar deneyin.",
  "odeme-bulunamadi": "Ödeme kaydı bulunamadı, lütfen tekrar deneyin.",
  "odeme-ayar-yok": "Online ödeme şu an kullanılamıyor.",
  "urun-yok": "Seçilen ürün şu an mevcut değil.",
  "siparis-bos": "En az bir ürün işaretlemelisiniz.",
};

export default async function GuestDashboard({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const guestId = cookies().get("oa_guest")?.value;
  if (!guestId) redirect("/musteri/giris");

  const [guest, menuSettings, menu] = await Promise.all([
    prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          include: {
            room: { include: { type: true } },
            payments: true,
            roomServiceCharges: { orderBy: { createdAt: "desc" } },
          },
        },
        tasks: { orderBy: { createdAt: "desc" }, include: { room: true } },
      },
    }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
    getMenu(),
  ]);

  if (!guest) redirect("/musteri/giris");

  const integration = await getIntegrationSettings();
  const paymentsEnabled = integration.iyzicoEnabled && Boolean(integration.iyzicoApiKey) && Boolean(integration.iyzicoSecretKey);

  const totalDebt = guest.reservations
    .filter((r) => r.status !== "IPTAL")
    .reduce((sum, r) => sum + Math.max(0, r.totalAmount - r.payments.reduce((s, p) => s + p.amount, 0)), 0);

  // Talep formunda secilebilecek daireler: gecmis/guncel rezervasyonlardan tekillestirilmis liste.
  const roomMap = new Map<string, (typeof guest.reservations)[number]["room"]>();
  for (const r of guest.reservations) roomMap.set(r.room.id, r.room);
  const myRooms = Array.from(roomMap.values());
  // "Su an kalinan rezervasyon" - personel her zaman durumu "Giris yapti"ya
  // cevirmeyebilir, o yuzden tarihe de bakiyoruz: bugun giris-cikis araligindaysa
  // ve iptal/tamamlanmis degilse aktif sayilir.
  const now = new Date();
  const activeReservation = guest.reservations.find(
    (r) => r.status !== "IPTAL" && r.status !== "TAMAMLANDI" && r.checkIn <= now && r.checkOut > now
  );
  const menuOpen = Boolean(menuSettings?.menuEnabled) && menu.categories.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Merhaba, {guest.fullName.split(" ")[0]}</h1>
      <p className="mt-1 text-sm text-ink-soft">Rezervasyonlarınızı, ödeme durumunuzu ve taleplerinizi buradan takip edebilirsiniz.</p>

      {searchParams.ok === "talep" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Talebiniz bize ulaştı, en kısa sürede ilgileneceğiz.
        </p>
      )}
      {searchParams.ok === "odeme" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Ödemeniz alındı, teşekkür ederiz.
        </p>
      )}
      {searchParams.ok === "siparis-verildi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Siparişiniz alındı, personel onayladıktan sonra odanızın hesabına işlenecek.
        </p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <div className="card mt-5 p-5">
        <div className="text-xs text-ink-soft">Toplam bakiyeniz</div>
        <div className={`mt-1 text-3xl font-extrabold tracking-tight ${totalDebt > 0 ? "text-red-700" : "text-brand-600"}`}>
          {totalDebt > 0 ? fmtMoney(totalDebt) : "Borcunuz yok"}
        </div>
        {totalDebt > 0 && <p className="mt-1 text-xs text-ink-soft">Ödemeleriniz için işletmeyle iletişime geçebilirsiniz.</p>}
      </div>

      {(guest.wifiNetwork || guest.wifiPassword) && (
        <div className="card mt-5 flex items-center gap-4 border-gold-200 bg-gold-50/60 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500 text-lg text-white">📶</span>
          <div>
            <div className="text-xs font-bold text-gold-700">WiFi bilgileriniz</div>
            <div className="mt-1 text-sm">
              {guest.wifiNetwork && (
                <span className="mr-4">
                  Ağ adı: <b className="font-extrabold">{guest.wifiNetwork}</b>
                </span>
              )}
              {guest.wifiPassword && (
                <span>
                  Şifre: <b className="font-extrabold tracking-wide">{guest.wifiPassword}</b>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Rezervasyonlarım</h2>
        {guest.reservations.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz bir rezervasyon kaydınız yok.</p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Daire</th>
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Tutar</th>
                <th className="pb-2">Kalan</th>
                <th className="pb-2">Durum</th>
                <th className="pb-2">Sözleşme</th>
                {paymentsEnabled && <th className="pb-2">Ödeme</th>}
              </tr>
            </thead>
            <tbody>
              {guest.reservations.map((r) => {
                const paid = r.payments.reduce((s, p) => s + p.amount, 0);
                const balance = Math.max(0, r.totalAmount - paid);
                return (
                  <tr key={r.id} className="border-t border-line">
                    <td className="py-3 font-semibold">{r.room.number} · {r.room.type.code}</td>
                    <td className="py-3 text-xs">{fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}</td>
                    <td className="py-3">{STAY_LABEL[r.stayType] ?? r.stayType}</td>
                    <td className="py-3">{fmtMoney(r.totalAmount)}</td>
                    <td className="py-3 font-bold">{balance ? fmtMoney(balance) : "—"}</td>
                    <td className="py-3">{RES_STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="py-3">
                      <a href={`/api/sozlesme/${r.id}`} className="text-xs font-bold text-brand-600 hover:underline">
                        İndir
                      </a>
                    </td>
                    {paymentsEnabled && (
                      <td className="py-3">
                        {balance > 0 && r.status !== "IPTAL" ? (
                          <form action={startOnlinePayment}>
                            <input type="hidden" name="reservationId" value={r.id} />
                            <button className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">
                              Kredi kartıyla öde
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-ink-soft">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {menuOpen && activeReservation && (
        <section className="card mt-5 p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Odaya yemek/içecek sipariş edin</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Sipariş verdiğinizde personel onayladıktan sonra odanızın hesabına işlenir. Tam menüyü{" "}
            <a href="/menu" target="_blank" rel="noopener" className="font-bold text-brand-600 hover:underline">
              buradan
            </a>{" "}
            görebilirsiniz.
          </p>

          <form action={createGuestRoomServiceOrder} className="space-y-5">
            <input type="hidden" name="reservationId" value={activeReservation.id} />
            {menu.categories.map((cat) => (
              <div key={cat.id}>
                <h3 className="mb-2 text-sm font-extrabold text-brand-700">{cat.name}</h3>
                <div className="space-y-1.5">
                  {cat.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50/50"
                    >
                      <input type="checkbox" name="items" value={item.id} className="h-4 w-4 shrink-0" />
                      <span className="flex-1 font-semibold">{item.name}</span>
                      {item.description && <span className="w-full text-xs text-ink-soft sm:w-auto">{item.description}</span>}
                      <span className="shrink-0 font-bold text-brand-600">{fmtMoney(item.price)}</span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs">
                        Adet
                        <input
                          name={`qty_${item.id}`}
                          type="number"
                          min={1}
                          step={1}
                          defaultValue={1}
                          className="w-14 rounded-lg border border-line px-2 py-1"
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <input name="note" placeholder="Not (isteğe bağlı, örn. acısız olsun)" className="w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            <button className="btn-primary w-full sm:w-auto">Seçtiklerimi sipariş ver</button>
          </form>

          {activeReservation.roomServiceCharges.length > 0 && (
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="mb-2 text-sm font-extrabold">Siparişlerim</h3>
              <ul className="space-y-1.5">
                {activeReservation.roomServiceCharges.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold">
                      {c.name} × {c.quantity}
                    </span>
                    <span className="text-ink-soft">{fmtMoney(c.amount)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.status === "ONAYLANDI"
                          ? "bg-brand-50 text-brand-600"
                          : c.status === "REDDEDILDI"
                            ? "bg-red-50 text-red-700"
                            : "bg-gold-50 text-gold-700"
                      }`}
                    >
                      {c.status === "ONAYLANDI" ? "Onaylandı" : c.status === "REDDEDILDI" ? "Reddedildi" : "Bekliyor"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Dairenizle ilgili bir talebiniz mi var?</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Televizyon arızası, kapı kolu, musluk sorunu gibi bakım taleplerinizi buradan iletebilirsiniz.
        </p>

        {myRooms.length === 0 ? (
          <p className="text-sm text-ink-soft">Talep oluşturmak için önce bir rezervasyon kaydınız olmalı.</p>
        ) : (
          <form action={createGuestRequest} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Daire
              <select name="roomId" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                {myRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Oda {r.number}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold">
              Konu
              <input name="title" placeholder="Örn. Televizyon açılmıyor" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold sm:col-span-2">
              Detay (isteğe bağlı)
              <textarea name="message" rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <div className="sm:col-span-2">
              <button className="btn-primary">Talebi gönder</button>
            </div>
          </form>
        )}
      </section>

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Taleplerim</h2>
        {guest.tasks.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz bir talebiniz yok.</p>
        ) : (
          <ul className="space-y-2">
            {guest.tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2 text-sm">
                <div>
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-xs text-ink-soft">
                    Oda {t.room.number} · {fmtDate(t.createdAt)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    t.status === "TAMAMLANDI" ? "bg-brand-50 text-brand-600" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {t.status === "TAMAMLANDI" ? "Tamamlandı" : "Beklemede"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
