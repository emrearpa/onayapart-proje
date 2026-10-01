import { prisma } from "@/shared/lib/db";
import { fmtDate, fmtMoney, toInputDate, addDays } from "@/shared/lib/dates";
import { stayTypes } from "@/features/reservations/constants";
import { getAccounts } from "@/features/accounting/queries";
import { createReservation, setReservationStatus, addPayment, findGuestByPhone } from "@/features/reservations/actions";
import SearchBox from "@/shared/components/panel/SearchBox";
import PhoneInput from "@/shared/components/panel/PhoneInput";
import ExtraGuestFields from "@/features/reservations/components/ExtraGuestFields";
import PaymentRowForm from "@/features/reservations/components/PaymentRowForm";

export const dynamic = "force-dynamic";

const STATUSES = ["OPSIYON", "ONAYLI", "GIRIS_YAPTI", "TAMAMLANDI", "IPTAL"];
const STATUS_LABEL: Record<string, string> = {
  OPSIYON: "Opsiyon",
  ONAYLI: "Onaylı",
  GIRIS_YAPTI: "Giriş yaptı",
  TAMAMLANDI: "Çıkış Yaptı",
  IPTAL: "İptal",
};

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: { hata?: string; ok?: string; q?: string; misafir?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const qAsNumber = Number(q);
  const isNumericQuery = q !== "" && Number.isFinite(qAsNumber);

  // "misafir" query param'i varsa (Musteriler sayfasindan "Yeni rezervasyon olustur"
  // ile ya da telefon aramasiyla gelinmisse), o misafirin bilgilerini formu
  // on-doldurmak icin cekiyoruz.
  const prefillGuest = searchParams.misafir
    ? await prisma.guest.findUnique({ where: { id: searchParams.misafir } })
    : null;

  const [rooms, reservations, accounts, employees] = await Promise.all([
    prisma.room.findMany({ orderBy: { number: "asc" }, include: { type: true } }),
    prisma.reservation.findMany({
      where: q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { guest: { fullName: { contains: q, mode: "insensitive" } } },
              { guest: { phone: { contains: q, mode: "insensitive" } } },
              ...(isNumericQuery ? [{ room: { number: qAsNumber } }] : []),
            ],
          }
        : undefined,
      orderBy: { checkIn: "desc" },
      include: { guest: true, room: true, payments: true, handledByEmployee: true },
      take: 60,
    }),
    getAccounts(),
    prisma.employee.findMany({ where: { status: "AKTIF" }, orderBy: { fullName: "asc" } }),
  ]);

  const today = new Date();

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Rezervasyonlar</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Kaydı oluşturduğunuzda müşteri otomatik olarak Müşteriler listesine eklenir (aynı telefonla daha önce kayıt
        varsa geçmişi tek yerde toplanır) ve sözleşmesi otomatik hazırlanır.
      </p>

      {searchParams.hata === "cakisma" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Bu daire seçtiğiniz tarihlerde zaten dolu. Başka tarih veya daire seçin.
        </p>
      )}
      {searchParams.hata === "cakisma-harici" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Bu daire seçtiğiniz tarihlerde Booking.com veya Airbnb üzerinden dolu görünüyor. Başka tarih veya daire
          seçin, ya da önce ilgili platformdan kontrol edin.
        </p>
      )}
      {searchParams.hata === "eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Misafir adı, telefon ve tarihler eksiksiz olmalı; çıkış tarihi girişten sonra olmalı.
        </p>
      )}
      {searchParams.hata === "personel-eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          Rezervasyonu alan personeli seçmelisiniz.
        </p>
      )}
      {searchParams.hata === "telefon-eksik" && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">Bir telefon numarası girin.</p>
      )}
      {searchParams.hata === "misafir-bulunamadi" && (
        <p className="mt-4 rounded-xl bg-gold-50 p-4 text-sm font-semibold text-gold-700">
          Bu telefonla kayıtlı bir müşteri bulunamadı — yeni misafir olarak aşağıdan kaydedebilirsiniz.
        </p>
      )}
      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Rezervasyon oluşturuldu. Aşağıdaki tablodan sözleşmesini indirebilirsiniz.
        </p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Daha önce kalmış mı?</h2>
        <p className="mb-3 text-sm text-ink-soft">
          Misafir &quot;daha önce burada kaldım&quot; derse, telefon numarasıyla arayın — bulunursa aşağıdaki form
          bilgileriyle otomatik doldurulur, siz sadece daire ve tarihi seçersiniz.
        </p>
        <form action={findGuestByPhone} className="flex flex-wrap gap-2">
          <input
            name="phone"
            type="tel"
            placeholder="Telefon numarası (0553 673 27 72 gibi, format önemli değil)"
            className="w-72 rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
          />
          <button className="btn-outline">Ara ve doldur</button>
        </form>
      </section>

      <section className="card mt-5 p-5" id="yeni-rezervasyon">
        <h2 className="mb-1 font-extrabold tracking-tight">Yeni rezervasyon</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Kimlik bilgileri sözleşmede ve yasal kimlik bildiriminde kullanılır; mümkünse eksiksiz doldurun.
        </p>
        <form action={createReservation} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-bold">
            Daire
            <select name="roomId" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} — {r.type.code}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold">
            Konaklama tipi
            <select name="stayType" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {stayTypes.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold">
            Giriş tarihi
            <input
              type="date"
              name="checkIn"
              defaultValue={toInputDate(today)}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Çıkış tarihi
            <input
              type="date"
              name="checkOut"
              defaultValue={toInputDate(addDays(today, 3))}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <div className="sm:col-span-2 xl:col-span-4 border-t border-line pt-3 text-xs font-bold text-ink-soft">
            Misafir kimlik ve iletişim bilgileri
            {prefillGuest && (
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                {prefillGuest.fullName} için bilgiler otomatik dolduruldu — kontrol edip düzenleyebilirsiniz
              </span>
            )}
          </div>

          <label className="text-xs font-bold">
            Ad Soyad
            <input
              name="fullName"
              defaultValue={prefillGuest?.fullName ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Telefon
            <div className="mt-1">
              <PhoneInput name="phone" defaultValue={prefillGuest?.phone ?? ""} />
            </div>
          </label>

          <label className="text-xs font-bold">
            E-posta (isteğe bağlı)
            <input
              name="email"
              type="email"
              defaultValue={prefillGuest?.email ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Kimlik türü
            <select
              name="idType"
              defaultValue={prefillGuest?.idType ?? "TC"}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            >
              <option value="TC">T.C. Kimlik</option>
              <option value="PASAPORT">Pasaport</option>
            </select>
          </label>

          <label className="text-xs font-bold">
            Kimlik / Pasaport No
            <input
              name="idNumber"
              defaultValue={prefillGuest?.idNumber ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Doğum tarihi
            <input
              type="date"
              name="birthDate"
              defaultValue={prefillGuest?.birthDate ? toInputDate(prefillGuest.birthDate) : ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Uyruk
            <input
              name="nationality"
              defaultValue={prefillGuest?.nationality ?? "TR"}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold sm:col-span-2 xl:col-span-1">
            İkamet adresi (isteğe bağlı)
            <input
              name="address"
              defaultValue={prefillGuest?.address ?? ""}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <div className="sm:col-span-2 xl:col-span-4 border-t border-line pt-3 text-xs font-bold text-ink-soft">
            Bedel
          </div>

          <label className="text-xs font-bold">
            Toplam tutar (₺)
            <input
              type="number"
              name="totalAmount"
              min={0}
              step={50}
              defaultValue={0}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Depozito (₺)
            <input
              type="number"
              name="deposit"
              min={0}
              step={50}
              defaultValue={0}
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>

          <label className="text-xs font-bold">
            Rezervasyonu alan personel *
            <select name="handledByEmployeeId" required defaultValue="" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="" disabled>
                Seçiniz
              </option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-bold sm:col-span-2 xl:col-span-2">
            Rezervasyon notu (isteğe bağlı)
            <input name="notes" placeholder="Örn. geç giriş yapacak, ek yastık istedi vb." className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>

          <div className="group border-t border-line pt-3 sm:col-span-2 xl:col-span-4">
            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" name="billToCompany" className="h-4 w-4" />
              Kurumsal müşteri — fatura kişiye değil firmaya kesilecek
            </label>
            <div className="mt-2 hidden gap-2 group-has-[:checked]:grid sm:grid-cols-2 xl:grid-cols-4">
              <input name="companyName" placeholder="Firma unvanı" className="rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              <input name="companyTaxNo" placeholder="Vergi no" className="rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              <input name="companyTaxOffice" placeholder="Vergi dairesi" className="rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              <input name="companyAddress" placeholder="Firma adresi" className="rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </div>
          </div>

          <div className="sm:col-span-2 xl:col-span-4">
            <ExtraGuestFields />
          </div>

          <div className="flex items-end sm:col-span-2 xl:col-span-2">
            <button className="btn-primary w-full">Rezervasyonu kaydet</button>
          </div>
        </form>
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Kayıtlar</h2>
          <SearchBox placeholder="İsim, telefon, oda no veya kod ara..." value={q} />
        </div>
        {reservations.length === 0 ? (
          <p className="text-sm text-ink-soft">{q ? "Aramanızla eşleşen rezervasyon bulunamadı." : "Henüz rezervasyon yok."}</p>
        ) : (
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Kod</th>
                <th className="pb-2">Misafir</th>
                <th className="pb-2">Daire</th>
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Tutar</th>
                <th className="pb-2">Kalan</th>
                <th className="pb-2">Durum</th>
                <th className="pb-2">Tahsilat</th>
                <th className="pb-2">Sözleşme</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => {
                const paid = r.payments.reduce((s, p) => s + p.amount, 0);
                const balance = Math.max(0, r.totalAmount - paid);
                return (
                  <tr key={r.id} className="border-t border-line align-middle transition hover:bg-brand-50/30">
                    <td className="py-3 font-semibold">{r.code}</td>
                    <td className="py-3">
                      {r.guest.fullName}
                      <span className="block text-xs text-ink-soft">{r.guest.phone}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-soft">
                        {r.handledByEmployee && <span>👤 {r.handledByEmployee.fullName}</span>}
                        {r.billToCompany && (
                          <span className="rounded-full bg-violet-50 px-1.5 py-0.5 font-bold text-violet-700">Kurumsal</span>
                        )}
                      </span>
                      {r.notes && <span className="mt-0.5 block text-[11px] italic text-ink-soft">“{r.notes}”</span>}
                    </td>
                    <td className="py-3">{r.room.number}</td>
                    <td className="py-3 text-xs">
                      {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                    </td>
                    <td className="py-3">{fmtMoney(r.totalAmount)}</td>
                    <td className="py-3 font-bold">{balance ? fmtMoney(balance) : "—"}</td>
                    <td className="py-3">
                      <form action={setReservationStatus} className="flex gap-1">
                        <input type="hidden" name="id" value={r.id} />
                        <select
                          name="status"
                          defaultValue={r.status}
                          className="rounded-lg border border-line px-2 py-1.5 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white">
                          Kaydet
                        </button>
                      </form>
                    </td>
                    <td className="py-3">
                      <PaymentRowForm action={addPayment} reservationId={r.id} accounts={accounts} />
                    </td>
                    <td className="py-3">
                      <a href={`/api/sozlesme/${r.id}`} className="text-xs font-bold text-brand-600 hover:underline">
                        İndir
                      </a>
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
