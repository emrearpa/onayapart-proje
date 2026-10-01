import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { getAmenities } from "@/features/rooms/queries";
import { setRoomCondition, setRoomPublished, setRate, createRoom, sendRoomInfoWhatsapp, deleteRoom } from "@/features/rooms/actions";
import { syncAllCalendars } from "@/features/calendar-sync/actions";
import SearchBox from "@/shared/components/panel/SearchBox";
import ConfirmButton from "@/shared/components/ConfirmButton";

export const dynamic = "force-dynamic";

const CONDITIONS = [
  ["MUSAIT", "Müsait"],
  ["TEMIZLIK", "Temizlikte"],
  ["BAKIM", "Bakımda"],
];

const MESSAGES: Record<string, string> = {
  eklendi: "Daire eklendi.",
  silindi: "Daire silindi.",
  "wa-gonderildi": "Oda bilgisi WhatsApp'tan gönderildi.",
};
const ERRORS: Record<string, string> = {
  eksik: "Daire numarası ve oda tipi zorunludur.",
  cakisma: "Bu daire numarası zaten kullanılıyor.",
  "telefon-eksik": "Bir telefon numarası girin.",
  "oda-bulunamadi": "Oda bulunamadı.",
  "wa-hata": "WhatsApp mesajı gönderilemedi.",
};

export default async function RoomsAdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; basarili?: string; toplam?: string; q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [rooms, types, amenities] = await Promise.all([
    prisma.room.findMany({ orderBy: { number: "asc" }, include: { type: true, photos: true, externalCalendars: true } }),
    prisma.roomType.findMany({ orderBy: { sort: "asc" }, include: { rates: { orderBy: { sort: "asc" } } } }),
    getAmenities(),
  ]);

  const totalCalendars = rooms.reduce((s, r) => s + r.externalCalendars.length, 0);
  const visibleRooms = q
    ? rooms.filter((r) => String(r.number).includes(q) || r.type.name.toLowerCase().includes(q))
    : rooms;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Odalar ve fiyatlar</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Buradaki her değişiklik birkaç dakika içinde sitedeki ilgili sayfaya yansır.
          </p>
        </div>
        {totalCalendars > 0 && (
          <form action={syncAllCalendars}>
            <button className="btn-outline">Tüm Booking.com/Airbnb takvimlerini senkronize et ({totalCalendars})</button>
          </form>
        )}
      </div>

      {searchParams.ok === "takvim-toplu" ? (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          {searchParams.toplam} takvimden {searchParams.basarili} tanesi başarıyla senkronize edildi.
        </p>
      ) : (
        searchParams.ok && (
          <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok]}</p>
        )
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {types.length === 0 ? (
        <section className="card mt-5 p-5">
          <p className="text-sm text-ink-soft">
            Önce en az bir oda tipi oluşturmalısınız.{" "}
            <Link href="/panel/tipler" className="font-bold text-brand-600">
              Oda tipleri ekranına gidin →
            </Link>
          </p>
        </section>
      ) : (
        <section className="card mt-5 p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Yeni daire ekle</h2>
          <form action={createRoom} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-bold">
              Daire numarası
              <input name="number" type="number" required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Oda tipi
              <select name="typeId" required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold">
              Kat
              <input name="floor" type="number" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Büyüklük (m²)
              <input name="m2" type="number" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold sm:col-span-2">
              Yatak düzeni
              <input name="beds" placeholder="1 çift kişilik yatak" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold sm:col-span-2">
              Cephe
              <input name="view" placeholder="Cadde cephesi" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <fieldset className="sm:col-span-2 xl:col-span-4">
              <legend className="mb-2 text-xs font-bold">Bu dairede neler var?</legend>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {amenities.map((a) => (
                  <label key={a.icon} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="amenities" value={a.icon} defaultChecked className="h-4 w-4" />
                    {a.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2 xl:col-span-4">
              <input type="checkbox" name="isPublished" defaultChecked className="h-4 w-4" />
              Sitede hemen yayınla
              <span className="font-normal text-ink-soft">— kapatırsanız daire panelde kalır ama site ziyaretçileri göremez</span>
            </label>

            <div className="flex items-end sm:col-span-2 xl:col-span-4">
              <button className="btn-primary">Daireyi ekle</button>
            </div>
          </form>
        </section>
      )}

      <section className="card mt-5 p-5">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-extrabold tracking-tight">Fiyatlar</h2>
          <Link href="/panel/tipler" className="text-xs font-bold text-brand-600">
            Oda tiplerini yönet →
          </Link>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Fiyatı 0 bırakırsanız sitede &quot;Fiyat için arayın&quot; yazar. Sezon fiyatı vermek istediğinizde buradan
          güncelleyin.
        </p>

        <div className="grid gap-5 md:grid-cols-3">
          {types.map((t) => (
            <div key={t.id} className="rounded-xl border border-line p-4">
              <h3 className="font-extrabold">{t.name}</h3>
              <div className="mt-3 space-y-2">
                {t.rates.map((r) => (
                  <form key={r.id} action={setRate} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <span className="flex-1 text-sm">{r.label}</span>
                    <input
                      name="price"
                      type="number"
                      min={0}
                      step={50}
                      defaultValue={r.price}
                      className="w-24 rounded-lg border border-line px-2 py-1.5 text-sm"
                    />
                    <button className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white">Kaydet</button>
                  </form>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Daireler ({rooms.length})</h2>
          <SearchBox placeholder="Oda no veya tip ara..." value={q} />
        </div>
        {visibleRooms.length === 0 && (
          <p className="mb-3 text-sm text-ink-soft">Aramanızla eşleşen daire bulunamadı.</p>
        )}
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-ink-soft">
              <th className="pb-2">Oda</th>
              <th className="pb-2">Tip</th>
              <th className="pb-2">Kat / m²</th>
              <th className="pb-2">Fotoğraf</th>
              <th className="pb-2">Durum</th>
              <th className="pb-2">Yayın</th>
              <th className="pb-2">WhatsApp</th>
              <th className="pb-2"></th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {visibleRooms.map((r) => (
              <tr key={r.id} className="border-t border-line transition hover:bg-brand-50/30">
                <td className="py-3 font-bold">{r.number}</td>
                <td className="py-3">{r.type.code}</td>
                <td className="py-3 text-ink-soft">
                  {r.floor}. kat · {r.m2} m²
                </td>
                <td className="py-3">
                  {r.photos.length > 0 ? (
                    <span className="font-semibold text-brand-600">{r.photos.length} adet</span>
                  ) : (
                    <span className="text-amber-700">yok</span>
                  )}
                </td>
                <td className="py-3">
                  <form action={setRoomCondition} className="flex gap-1">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="condition" defaultValue={r.condition} className="rounded-lg border border-line px-2 py-1.5 text-xs">
                      {CONDITIONS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-bold text-white">Kaydet</button>
                  </form>
                </td>
                <td className="py-3">
                  <form action={setRoomPublished}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="isPublished" value={String(!r.isPublished)} />
                    <button
                      className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
                        r.isPublished ? "bg-brand-50 text-brand-600" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.isPublished ? "Yayında" : "Gizli"}
                    </button>
                  </form>
                </td>
                <td className="py-3">
                  <form action={sendRoomInfoWhatsapp} target="_blank" className="flex items-center gap-1">
                    <input type="hidden" name="roomId" value={r.id} />
                    <input type="hidden" name="back" value="/panel/odalar" />
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Telefon"
                      className="w-28 rounded-lg border border-line px-2 py-1.5 text-xs"
                    />
                    <button className="whitespace-nowrap rounded-lg bg-[#1f9d55] px-2 py-1.5 text-[11px] font-bold text-white">
                      💬 Gönder
                    </button>
                  </form>
                </td>
                <td className="py-3">
                  <Link href={`/panel/odalar/${r.number}`} className="text-xs font-bold text-brand-600 hover:underline">
                    Düzenle / Foto
                  </Link>
                </td>
                <td className="py-3">
                  <form action={deleteRoom}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="number" value={r.number} />
                    <ConfirmButton
                      message={`Oda ${r.number} kalıcı olarak silinsin mi? Bu işlem geri alınamaz. (Odanın geçmiş/aktif rezervasyonu varsa silme reddedilir, bunun yerine "Gizle" kullanın.)`}
                      className="text-xs font-bold text-red-700 hover:underline"
                    >
                      Sil
                    </ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
