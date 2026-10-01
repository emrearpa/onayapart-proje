import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { fmtDate, fmtMoney, toInputDate } from "@/lib/dates";
import { getAccounts } from "@/lib/queries";
import {
  updateGuest,
  createExtraGuest,
  deleteExtraGuest,
  addRoomServiceCharge,
  deleteRoomServiceCharge,
  approveRoomServiceCharge,
  rejectRoomServiceCharge,
  addPayment,
} from "../../actions";
import ConfirmButton from "@/components/ConfirmButton";
import PhoneInput from "@/components/panel/PhoneInput";
import PaymentRowForm from "@/components/panel/PaymentRowForm";

export const dynamic = "force-dynamic";

const RES_STATUS_LABEL: Record<string, string> = {
  OPSIYON: "Opsiyon",
  ONAYLI: "Onaylı",
  GIRIS_YAPTI: "Giriş yaptı",
  TAMAMLANDI: "Çıkış Yaptı",
  IPTAL: "İptal",
};

export default async function GuestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { ok?: string; hata?: string };
}) {
  const [guest, menuItems, accounts] = await Promise.all([
    prisma.guest.findUnique({
      where: { id: params.id },
      include: {
        reservations: {
          orderBy: { checkIn: "desc" },
          include: {
            room: { include: { type: true } },
            payments: true,
            extraGuests: { orderBy: { createdAt: "asc" } },
            roomServiceCharges: { orderBy: { createdAt: "asc" } },
            handledByEmployee: true,
          },
        },
      },
    }),
    prisma.menuItem.findMany({ where: { isAvailable: true }, orderBy: { name: "asc" } }),
    getAccounts(),
  ]);

  if (!guest) notFound();

  const reservationLogs = await prisma.activityLog.findMany({
    where: { reservationId: { in: guest.reservations.map((r) => r.id) } },
    orderBy: { createdAt: "asc" },
  });
  const logsByReservation = new Map<string, typeof reservationLogs>();
  for (const log of reservationLogs) {
    if (!log.reservationId) continue;
    if (!logsByReservation.has(log.reservationId)) logsByReservation.set(log.reservationId, []);
    logsByReservation.get(log.reservationId)!.push(log);
  }

  const totalBalance = guest.reservations
    .filter((r) => r.status !== "IPTAL")
    .reduce((s, r) => s + Math.max(0, r.totalAmount - r.payments.reduce((a, p) => a + p.amount, 0)), 0);

  return (
    <div>
      <Link href="/panel/musteriler" className="text-xs font-bold text-brand-600">
        ← Müşteriler listesine dön
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">{guest.fullName}</h1>
        <Link href={`/panel/rezervasyonlar?misafir=${guest.id}#yeni-rezervasyon`} className="btn-primary">
          + Yeni rezervasyon oluştur
        </Link>
      </div>

      {searchParams.ok === "1" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Bilgiler güncellendi.</p>
      )}
      {searchParams.ok === "misafir-eklendi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Ek misafir eklendi.</p>
      )}
      {searchParams.ok === "misafir-silindi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Ek misafir silindi.</p>
      )}
      {searchParams.ok === "servis-eklendi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Oda servisi hesaba eklendi.</p>
      )}
      {searchParams.ok === "servis-silindi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Oda servisi kaydı silindi.</p>
      )}
      {searchParams.ok === "servis-onaylandi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Sipariş onaylandı, tutar rezervasyona işlendi.</p>
      )}
      {searchParams.ok === "servis-reddedildi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Sipariş reddedildi, hesaba işlenmedi.</p>
      )}
      {searchParams.hata === "misafir-eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Ek misafirin adı soyadı zorunludur.</p>
      )}
      {searchParams.hata === "servis-eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Ürün adı (veya menüden seçim) ve geçerli bir fiyat zorunludur.
        </p>
      )}
      {searchParams.hata && !["misafir-eksik", "servis-eksik"].includes(searchParams.hata) && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Ad soyad ve telefon zorunludur.</p>
      )}

      <div className="card mt-5 p-5">
        <div className="text-xs text-ink-soft">Toplam bakiye</div>
        <div className={`mt-1 text-2xl font-extrabold ${totalBalance > 0 ? "text-red-700" : "text-brand-600"}`}>
          {totalBalance > 0 ? fmtMoney(totalBalance) : "Borcu yok"}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Kimlik ve iletişim bilgileri</h2>
          <form action={updateGuest} className="grid gap-3">
            <input type="hidden" name="id" value={guest.id} />

            <label className="text-xs font-bold">
              Ad Soyad
              <input name="fullName" defaultValue={guest.fullName} required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Telefon
              <div className="mt-1">
                <PhoneInput name="phone" defaultValue={guest.phone} required />
              </div>
            </label>
            <label className="text-xs font-bold">
              E-posta
              <input name="email" type="email" defaultValue={guest.email ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                Kimlik türü
                <select name="idType" defaultValue={guest.idType} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                  <option value="TC">T.C. Kimlik</option>
                  <option value="PASAPORT">Pasaport</option>
                </select>
              </label>
              <label className="text-xs font-bold">
                Kimlik / Pasaport No
                <input name="idNumber" defaultValue={guest.idNumber ?? ""} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                Doğum tarihi
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={guest.birthDate ? toInputDate(guest.birthDate) : ""}
                  className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-xs font-bold">
                Uyruk
                <input name="nationality" defaultValue={guest.nationality} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
            </div>

            <label className="text-xs font-bold">
              İkamet adresi
              <textarea name="address" defaultValue={guest.address ?? ""} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3">
              <p className="mb-2 text-xs font-bold text-brand-700">📶 WiFi bilgisi — müşteri panelinde misafire gösterilir</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-bold">
                  Ağ adı (SSID)
                  <input name="wifiNetwork" defaultValue={guest.wifiNetwork ?? ""} placeholder="Örn. OnayApart_205" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal" />
                </label>
                <label className="text-xs font-bold">
                  Şifre
                  <input name="wifiPassword" defaultValue={guest.wifiPassword ?? ""} placeholder="Örn. hosgeldiniz2026" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm font-normal" />
                </label>
              </div>
            </div>

            <label className="text-xs font-bold">
              Not
              <textarea name="note" defaultValue={guest.note ?? ""} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <button className="btn-primary mt-2">Kaydet</button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Müşteri paneli girişi</h2>
          <p className="text-sm text-ink-soft">
            Müşteri artık ayrı bir kod almadan, kendi panelinde (onayapart.com/musteri) <b>telefon numarası</b> ve{" "}
            <b>T.C. kimlik numarası</b> ile giriş yapar. Bu ikisi aşağıda kayıtlı olduğu sürece giriş otomatik
            çalışır — sizin ayrıca bir şey yapmanıza gerek yok.
          </p>
          {!guest.idNumber && (
            <p className="mt-3 rounded-xl bg-gold-50 p-3 text-xs font-semibold text-gold-700">
              Bu müşterinin T.C. kimlik numarası kayıtlı değil, bu yüzden şu an panele giriş yapamaz. Aşağıdaki
              formdan ekleyin.
            </p>
          )}
        </section>
      </div>

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Konaklama geçmişi</h2>
        {guest.reservations.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz rezervasyon kaydı yok.</p>
        ) : (
          <div className="space-y-2">
            {guest.reservations.map((r) => {
              const paid = r.payments.reduce((s, p) => s + p.amount, 0);
              const balance = Math.max(0, r.totalAmount - paid);
              return (
                <details key={r.id} className="rounded-xl border border-line">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <span className="font-extrabold">{r.code}</span>
                    <span className="text-xs text-ink-soft">
                      {r.room.number} · {r.room.type.code}
                    </span>
                    <span className="text-xs text-ink-soft">
                      {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                    </span>
                    {r.extraGuests.length > 0 && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                        +{r.extraGuests.length} ek misafir
                      </span>
                    )}
                    {r.notes && (
                      <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold text-gold-700" title={r.notes}>
                        📝 not var
                      </span>
                    )}
                    {r.deposit > 0 && (
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                        💰 {fmtMoney(r.deposit)} depozito
                      </span>
                    )}
                    <span className="ml-auto text-xs">{RES_STATUS_LABEL[r.status] ?? r.status}</span>
                    <span className="font-bold">{fmtMoney(r.totalAmount)}</span>
                  </summary>

                  <div className="border-t border-line p-4">
                    {(r.notes || r.handledByEmployee || r.billToCompany) && (
                      <div className="mb-4 space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs">
                        {r.handledByEmployee && (
                          <div>
                            <b className="font-bold">Rezervasyonu alan:</b> {r.handledByEmployee.fullName}
                          </div>
                        )}
                        {r.billToCompany && (
                          <div>
                            <b className="font-bold">Kurumsal fatura:</b> {r.companyName}
                            {r.companyTaxNo && ` · VN: ${r.companyTaxNo}`}
                            {r.companyTaxOffice && ` · ${r.companyTaxOffice} V.D.`}
                            {r.companyAddress && <div className="text-ink-soft">{r.companyAddress}</div>}
                          </div>
                        )}
                        {r.notes && (
                          <div>
                            <b className="font-bold">Not:</b> <span className="italic">{r.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span>
                        Kalan bakiye:{" "}
                        <b className={balance > 0 ? "font-extrabold text-red-700" : "font-extrabold text-brand-600"}>
                          {balance ? fmtMoney(balance) : "Borcu yok"}
                        </b>
                        {r.deposit > 0 && (
                          <span className="ml-3 text-ink-soft">
                            · Alınan depozito: <b className="font-bold text-ink">{fmtMoney(r.deposit)}</b>
                          </span>
                        )}
                      </span>
                      <a href={`/api/sozlesme/${r.id}`} className="font-bold text-brand-600 hover:underline">
                        Sözleşmeyi indir →
                      </a>
                    </div>

                    {balance > 0 && (
                      <div className="mb-4 rounded-lg bg-red-50/60 p-3">
                        <h4 className="mb-2 text-xs font-extrabold text-red-700">Kalan borç için tahsilat yap</h4>
                        <PaymentRowForm action={addPayment} reservationId={r.id} accounts={accounts} />
                      </div>
                    )}

                    <h3 className="mb-2 text-sm font-extrabold">
                      Ek misafirler
                      <span className="ml-1 font-normal text-ink-soft">— aynı sürede kalan, ekstra ücretli ziyaretçiler</span>
                    </h3>

                    {r.extraGuests.length > 0 ? (
                      <ul className="mb-3 space-y-2">
                        {r.extraGuests.map((eg) => (
                          <li key={eg.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-2.5 text-xs">
                            <span className="font-bold">{eg.fullName}</span>
                            <span className="text-ink-soft">
                              {eg.idType === "TC" ? "T.C." : "Pasaport"}: {eg.idNumber || "—"}
                            </span>
                            <span className="text-ink-soft">{eg.nationality}</span>
                            {eg.fee > 0 && <span className="font-bold text-brand-600">{fmtMoney(eg.fee)} ek ücret</span>}
                            <form action={deleteExtraGuest} className="ml-auto">
                              <input type="hidden" name="id" value={eg.id} />
                              <input type="hidden" name="guestId" value={guest.id} />
                              <input type="hidden" name="reservationId" value={r.id} />
                              <ConfirmButton
                                message={`${eg.fullName} silinsin mi?${eg.fee > 0 ? " Ücreti rezervasyon tutarından düşülecek." : ""}`}
                                className="font-bold text-red-700 hover:underline"
                              >
                                Sil
                              </ConfirmButton>
                            </form>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-3 text-xs text-ink-soft">Bu rezervasyona henüz ek misafir eklenmedi.</p>
                    )}

                    <form action={createExtraGuest} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <input type="hidden" name="reservationId" value={r.id} />
                      <input type="hidden" name="guestId" value={guest.id} />
                      <input name="fullName" placeholder="Ad Soyad" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <select name="idType" className="rounded-lg border border-line px-3 py-2 text-xs">
                        <option value="TC">T.C. Kimlik No</option>
                        <option value="PASAPORT">Pasaport No</option>
                      </select>
                      <input name="idNumber" placeholder="Kimlik/pasaport numarası" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="birthDate" type="date" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="nationality" placeholder="Uyruk" defaultValue="T.C." className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="phone" placeholder="Telefon (isteğe bağlı)" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="fee" type="number" min={0} step={50} placeholder="Ek ücret ₺ (varsa)" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <button className="btn-primary">Ek misafir ekle</button>
                    </form>
                    <p className="mt-2 text-[11px] text-ink-soft">
                      Ücret girilirse rezervasyonun toplam tutarına otomatik eklenir. KBS bildirimini hâlâ resmi
                      portaldan (Gösterge panelindeki link) ayrıca yapmanız gerekir.
                    </p>

                    <h3 className="mb-2 mt-5 text-sm font-extrabold border-t border-line pt-4">
                      Oda servisi
                      <span className="ml-1 font-normal text-ink-soft">— odaya giden yemek/içecek hesabı</span>
                    </h3>

                    {r.roomServiceCharges.length > 0 ? (
                      <ul className="mb-3 space-y-2">
                        {r.roomServiceCharges.map((c) => (
                          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-2.5 text-xs">
                            <span className="font-bold">{c.name}</span>
                            <span className="text-ink-soft">
                              {c.quantity} adet × {fmtMoney(c.unitPrice)}
                            </span>
                            <span className="font-bold text-brand-600">{fmtMoney(c.amount)}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                c.status === "ONAYLANDI"
                                  ? "bg-brand-50 text-brand-600"
                                  : c.status === "REDDEDILDI"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-gold-50 text-gold-700"
                              }`}
                            >
                              {c.status === "ONAYLANDI" ? "Onaylı" : c.status === "REDDEDILDI" ? "Reddedildi" : "Bekliyor"}
                            </span>
                            {c.source === "MISAFIR" && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                Misafir sipariş etti
                              </span>
                            )}
                            {c.note && <span className="text-ink-soft">· {c.note}</span>}
                            <div className="ml-auto flex items-center gap-2">
                              {c.status === "BEKLIYOR" && (
                                <>
                                  <form action={approveRoomServiceCharge}>
                                    <input type="hidden" name="id" value={c.id} />
                                    <input type="hidden" name="guestId" value={guest.id} />
                                    <input type="hidden" name="reservationId" value={r.id} />
                                    <button className="font-bold text-brand-600 hover:underline">Onayla</button>
                                  </form>
                                  <form action={rejectRoomServiceCharge}>
                                    <input type="hidden" name="id" value={c.id} />
                                    <input type="hidden" name="guestId" value={guest.id} />
                                    <button className="font-bold text-red-700 hover:underline">Reddet</button>
                                  </form>
                                </>
                              )}
                              <form action={deleteRoomServiceCharge}>
                                <input type="hidden" name="id" value={c.id} />
                                <input type="hidden" name="guestId" value={guest.id} />
                                <input type="hidden" name="reservationId" value={r.id} />
                                <ConfirmButton
                                  message={
                                    c.status === "ONAYLANDI"
                                      ? `${c.name} silinsin mi? Tutarı rezervasyondan düşülecek.`
                                      : `${c.name} silinsin mi?`
                                  }
                                  className="font-bold text-ink-soft hover:text-red-700"
                                >
                                  Sil
                                </ConfirmButton>
                              </form>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mb-3 text-xs text-ink-soft">Bu rezervasyona henüz oda servisi kaydı eklenmedi.</p>
                    )}

                    <form action={addRoomServiceCharge} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <input type="hidden" name="reservationId" value={r.id} />
                      <input type="hidden" name="guestId" value={guest.id} />
                      {menuItems.length > 0 ? (
                        <label className="text-xs font-bold xl:col-span-2">
                          Menüden seç
                          <select name="menuItemId" className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-xs">
                            <option value="">— Menüden değil, elle gir —</option>
                            {menuItems.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({fmtMoney(m.price)})
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : (
                        <input type="hidden" name="menuItemId" value="" />
                      )}
                      <input name="customName" placeholder="Ürün adı (menüden seçmediyseniz)" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="customPrice" type="number" min={0} step={1} placeholder="Birim fiyat (₺, elle girerken)" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="quantity" type="number" min={1} step={1} defaultValue={1} placeholder="Adet" className="rounded-lg border border-line px-3 py-2 text-xs" />
                      <input name="note" placeholder="Not (isteğe bağlı)" className="rounded-lg border border-line px-3 py-2 text-xs sm:col-span-2 xl:col-span-3" />
                      <button className="btn-primary">Hesaba ekle</button>
                    </form>
                    <p className="mt-2 text-[11px] text-ink-soft">
                      Menüden bir ürün seçerseniz fiyatı otomatik gelir; menüde yoksa ürün adı ve fiyatını elle
                      girebilirsiniz. Eklenen tutar rezervasyonun toplam bedeline otomatik işlenir.
                    </p>

                    <h3 className="mb-2 mt-5 text-sm font-extrabold border-t border-line pt-4">
                      İşlem geçmişi
                      <span className="ml-1 font-normal text-ink-soft">— girişten çıkışa kim ne yaptı</span>
                    </h3>
                    {(logsByReservation.get(r.id) ?? []).length === 0 ? (
                      <p className="text-xs text-ink-soft">Bu rezervasyon için kayıtlı bir işlem yok.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {(logsByReservation.get(r.id) ?? []).map((log) => (
                          <li key={log.id} className="flex flex-wrap items-baseline gap-2 text-xs">
                            <span className="font-bold">{log.actorLabel}</span>
                            <span>{log.action}</span>
                            {log.details && <span className="text-ink-soft">— {log.details}</span>}
                            <span className="ml-auto shrink-0 text-[11px] text-ink-soft">{fmtDate(log.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
