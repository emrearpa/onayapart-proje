import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/shared/lib/db";
import { getAmenities } from "@/features/rooms/queries";
import { getRecordTranslations } from "@/features/content/translations";
import ConfirmButton from "@/shared/components/ConfirmButton";
import TranslationFields from "@/features/content/components/TranslationFields";
import { updateRoom, deleteRoom, addPhoto, deletePhoto, createAsset, updateAsset, deleteAsset, assignRoomAmenity, removeRoomAmenity, createAndAssignAmenity, sendRoomInfoWhatsapp } from "@/features/rooms/actions";
import { createExternalCalendar, deleteExternalCalendar, syncExternalCalendarNow } from "@/features/calendar-sync/actions";
import { site } from "@/shared/lib/site";
import { fmtDate } from "@/shared/lib/dates";
import { requirePanel } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const CONDITIONS = [
  ["MUSAIT", "Müsait"],
  ["TEMIZLIK", "Temizlikte"],
  ["BAKIM", "Bakımda"],
];

const ERRORS: Record<string, string> = {
  cakisma: "Bu daire numarası başka bir dairede kullanılıyor.",
  "takvim-eksik": "Geçerli bir takvim adresi girin (https:// ile başlayan .ics linki).",
  "takvim-senkron": "Senkronizasyon başarısız oldu. Adresin doğru olduğundan emin olun ve tekrar deneyin.",
  gecmis: "Bu dairede geçmiş veya aktif rezervasyon kaydı var, bu yüzden silinemiyor. Yayından kaldırmayı deneyin.",
  foto: "Bir dosya seçin ya da https:// ile başlayan bir görsel adresi girin.",
  "foto-buyuk": "Fotoğraf çok büyük (en fazla 8 MB).",
  "foto-tur": "Bu dosya türü desteklenmiyor (JPG, PNG, WEBP veya AVIF yükleyin).",
  eksik: "Daire numarası ve tipi zorunludur.",
  "demirbas-eksik": "Demirbaş adı zorunludur.",
  "olanak-eksik": "Özellik adı zorunludur.",
  "olanak-cakisma": "Bu isimde bir özellik zaten var.",
  "telefon-eksik": "Bir telefon numarası girin.",
  "oda-bulunamadi": "Oda bulunamadı.",
  "wa-hata": "WhatsApp mesajı gönderilemedi.",
};

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: { number: string };
  searchParams: { ok?: string; hata?: string };
}) {
  await requirePanel("odalar");
  const number = Number(params.number);
  if (!Number.isFinite(number)) notFound();

  const [room, types, amenities] = await Promise.all([
    prisma.room.findUnique({
      where: { number },
      include: {
        type: true,
        photos: { orderBy: { sort: "asc" } },
        assets: { orderBy: { createdAt: "asc" } },
        externalCalendars: { orderBy: { createdAt: "asc" } },
        externalBookings: { orderBy: { checkIn: "asc" } },
      },
    }),
    prisma.roomType.findMany({ orderBy: { sort: "asc" } }),
    getAmenities(),
  ]);

  if (!room) notFound();

  const roomTranslations = await getRecordTranslations("Room", room.id);

  // Bu daire icin daha once secim yapilmamissa (eski/varsayilan daireler) tum olanaklar isaretli gosterilir.
  const selectedAmenities = room.amenities ? room.amenities.split(",") : amenities.map((a) => a.icon);

  return (
    <div>
      <Link href="/panel/odalar" className="text-xs font-bold text-brand-600">
        ← Odalar listesine dön
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Oda {room.number} — {room.type.name}</h1>

      {searchParams.ok === "wa-gonderildi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          Oda bilgisi WhatsApp&apos;tan gönderildi.
        </p>
      )}
      {searchParams.ok && searchParams.ok !== "wa-gonderildi" && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">Kaydedildi.</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <section className="card mt-5 overflow-hidden p-0">
        <div className="bg-[#1f9d55]/10 px-5 py-4">
          <h2 className="font-extrabold tracking-tight text-[#1f9d55]">💬 Odayı WhatsApp&apos;tan gönder</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Müşteri telefonda &quot;odayı görmek istiyorum&quot; derse, numarasını girip gönderin — bu dairenin
            genel sayfasının linkini içeren bir mesaj hazırlanır.
          </p>
        </div>
        <form action={sendRoomInfoWhatsapp} target="_blank" className="flex flex-wrap items-end gap-2 p-5">
          <input type="hidden" name="roomId" value={room.id} />
          <label className="text-xs font-bold">
            Müşteri telefon numarası
            <input
              name="phone"
              type="tel"
              placeholder="0553 673 27 72"
              className="mt-1 w-64 rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <button className="rounded-xl bg-[#1f9d55] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#188046]">
            WhatsApp&apos;tan gönder
          </button>
        </form>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Daire bilgileri</h2>
          <form action={updateRoom} className="grid gap-3">
            <input type="hidden" name="id" value={room.id} />
            <input type="hidden" name="oldNumber" value={room.number} />

            <label className="text-xs font-bold">
              Daire numarası
              <input name="number" type="number" defaultValue={room.number} required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <label className="text-xs font-bold">
              Oda tipi
              <select name="typeId" defaultValue={room.typeId} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold">
                Kat
                <input name="floor" type="number" defaultValue={room.floor} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
              <label className="text-xs font-bold">
                Büyüklük (m²)
                <input name="m2" type="number" defaultValue={room.m2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
              </label>
            </div>

            <label className="text-xs font-bold">
              Yatak düzeni
              <input name="beds" defaultValue={room.beds} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <label className="text-xs font-bold">
              Cephe
              <input name="view" defaultValue={room.view} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>

            <div className="sm:col-span-2">
              <TranslationFields
                fields={[
                  { name: "beds", label: "Yatak düzeni" },
                  { name: "view", label: "Cephe" },
                ]}
                existing={roomTranslations}
              />
            </div>

            <label className="text-xs font-bold">
              Durum
              <select name="condition" defaultValue={room.condition} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                {CONDITIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold">
              <input type="checkbox" name="isPublished" defaultChecked={room.isPublished} className="h-4 w-4" />
              Sitede yayında
            </label>

            <button className="btn-primary mt-2">Değişiklikleri kaydet</button>
          </form>

          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs font-bold">Bu dairede neler var?</p>
            <p className="mb-2 text-xs text-ink-soft">
              Aşağıdaki × ile mevcut bir özelliği kaldırabilir, altındaki listeden yeni bir tane ekleyebilir ya da
              hiç olmayan bambaşka bir özellik yaratabilirsiniz. Her tıklama anında kaydedilir.
            </p>

            {selectedAmenities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {amenities
                  .filter((a) => selectedAmenities.includes(a.icon))
                  .map((a) => (
                    <form key={a.icon} action={removeRoomAmenity} className="inline-flex">
                      <input type="hidden" name="roomId" value={room.id} />
                      <input type="hidden" name="roomNumber" value={room.number} />
                      <input type="hidden" name="icon" value={a.icon} />
                      <button className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700">
                        {a.label}
                        <span aria-hidden>×</span>
                      </button>
                    </form>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-ink-soft">Bu dairede henüz hiçbir özellik işaretli değil.</p>
            )}

            {amenities.some((a) => !selectedAmenities.includes(a.icon)) && (
              <form action={assignRoomAmenity} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="roomId" value={room.id} />
                <input type="hidden" name="roomNumber" value={room.number} />
                <select name="icon" className="rounded-lg border border-line px-3 py-2 text-xs">
                  {amenities
                    .filter((a) => !selectedAmenities.includes(a.icon))
                    .map((a) => (
                      <option key={a.icon} value={a.icon}>
                        {a.label}
                      </option>
                    ))}
                </select>
                <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">+ Ekle</button>
              </form>
            )}

            <form action={createAndAssignAmenity} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="roomId" value={room.id} />
              <input type="hidden" name="roomNumber" value={room.number} />
              <input
                name="label"
                placeholder="Listede yok mu? Yeni özellik adı yazın (örn. Jakuzi)"
                className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-xs"
              />
              <button className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-600">
                Oluştur ve ekle
              </button>
            </form>
          </div>

          <form action={deleteRoom} className="mt-5 border-t border-line pt-4">
            <input type="hidden" name="id" value={room.id} />
            <input type="hidden" name="number" value={room.number} />
            <ConfirmButton
              message={`Oda ${room.number} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`}
              className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
            >
              Bu daireyi sil
            </ConfirmButton>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Fotoğraflar</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Fotoğraf eklemediğiniz sürece sitede marka renginde bir görsel gösterilir.
          </p>

          {room.photos.length > 0 ? (
            <div className="mb-5 grid grid-cols-3 gap-2">
              {room.photos.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-lg border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={p.alt} className="aspect-square w-full object-cover" />
                  <form action={deletePhoto} className="absolute right-1 top-1">
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="roomNumber" value={room.number} />
                    <input type="hidden" name="url" value={p.url} />
                    <ConfirmButton
                      message="Bu fotoğraf silinsin mi?"
                      className="grid h-6 w-6 place-items-center rounded-full bg-white/95 text-xs font-bold text-red-700 shadow"
                    >
                      ×
                    </ConfirmButton>
                  </form>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-5 text-sm text-amber-700">Bu dairede henüz fotoğraf yok.</p>
          )}

          <form action={addPhoto} className="space-y-3 border-t border-line pt-4">
            <input type="hidden" name="roomId" value={room.id} />
            <input type="hidden" name="roomNumber" value={room.number} />

            <label className="block text-xs font-bold">
              Fotoğraf açıklaması (alt metni)
              <input
                name="alt"
                placeholder={`Erzurum ${room.type.code} apart daire ${room.number} — salon`}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
              />
            </label>

            <label className="block text-xs font-bold">
              Bilgisayardan dosya yükle
              <input name="file" type="file" accept="image/*" className="mt-1 w-full rounded-xl border border-line px-3 py-2 text-sm font-normal" />
            </label>

            <div className="text-center text-xs text-ink-soft">— veya —</div>

            <label className="block text-xs font-bold">
              Görsel adresi (URL) yapıştır
              <input
                name="url"
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
              />
            </label>

            <button className="btn-primary w-full">Fotoğrafı ekle</button>
          </form>

          <p className="mt-4 text-xs text-ink-soft">
            Not: dosya yükleme, sunucunuzda kalıcı disk olduğu durumlarda (kendi sunucunuz / VPS) çalışır. Vercel gibi
            sunucusuz barındırmada yüklenen dosyalar kalıcı olmayabilir — o durumda görsel adresi alanını kullanın veya
            bize haber verin, kalıcı bir görsel deposuna (Cloudflare R2 vb.) bağlayalım.
          </p>
        </section>
      </div>

      {/* DEMIRBASLAR */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Demirbaşlar</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Bu odada bulunan televizyon, buzdolabı, yatak gibi demirbaşları buraya ekleyin. Bu daireye rezervasyon
          açıldığında liste otomatik olarak sözleşmeye eklenir.
        </p>

        {room.assets.length > 0 ? (
          <div className="mb-5 space-y-2">
            {room.assets.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
                <form action={updateAsset} className="flex flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="roomNumber" value={room.number} />
                  <input
                    name="name"
                    defaultValue={a.name}
                    className="min-w-[140px] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                    placeholder="Demirbaş adı"
                  />
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    defaultValue={a.quantity}
                    className="w-20 rounded-lg border border-line px-3 py-2 text-sm"
                  />
                  <input
                    name="note"
                    defaultValue={a.note ?? ""}
                    placeholder="Not (isteğe bağlı)"
                    className="min-w-[140px] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
                  />
                  <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                </form>
                <form action={deleteAsset}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="roomNumber" value={room.number} />
                  <ConfirmButton
                    message={`"${a.name}" demirbaşı silinsin mi?`}
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    Sil
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-5 text-sm text-amber-700">Bu daire için henüz demirbaş girilmedi.</p>
        )}

        <form action={createAsset} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="roomNumber" value={room.number} />
          <label className="text-xs font-bold">
            Demirbaş adı
            <input name="name" placeholder="Örn. Televizyon" className="mt-1 w-48 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Adet
            <input name="quantity" type="number" min={1} defaultValue={1} className="mt-1 w-20 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Not (isteğe bağlı)
            <input name="note" placeholder="Örn. Marka/model" className="mt-1 w-48 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <button className="btn-primary">Demirbaş ekle</button>
        </form>
      </section>

      {/* KANAL SENKRONIZASYONU */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Kanal senkronizasyonu (Booking.com / Airbnb)</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Çift rezervasyon olmasın diye bu odanın Booking.com ve Airbnb takvimlerini buradan bağlayın. Senkronizasyon
          birkaç saatte bir otomatik değil — aşağıdaki &quot;Şimdi senkronize et&quot; butonuyla anlık güncelleyin,
          günde birkaç kez kontrol etmeniz önerilir.
        </p>

        <div className="mb-5 rounded-xl border border-line bg-brand-50/40 p-4">
          <div className="text-xs font-bold text-ink-soft">Bu odanın kendi takvimi (Booking.com/Airbnb&apos;ye verin)</div>
          <p className="mt-1 text-xs text-ink-soft">
            Bu linki Booking.com Extranet veya Airbnb&apos;deki &quot;harici takvim ekle / senkronize et&quot; alanına
            yapıştırın; buradan girdiğiniz rezervasyonlar o platformlarda da dolu görünür.
          </p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs text-brand-700">
            {room.icalExportToken
              ? `${site.url}/api/ical/${room.icalExportToken}/calendar.ics`
              : "Link henüz oluşturulmadı — npm run setup çalıştırıldıktan sonra burada görünecek."}
          </code>
        </div>

        {room.externalCalendars.length > 0 && (
          <div className="mb-5 space-y-2">
            {room.externalCalendars.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {c.platform === "BOOKING" ? "Booking.com" : c.platform === "AIRBNB" ? "Airbnb" : "Diğer"}
                    </span>
                    {c.lastSyncAt ? (
                      <span className={`text-[11px] font-bold ${c.lastSyncOk ? "text-brand-600" : "text-red-700"}`}>
                        {c.lastSyncOk ? "✓ Senkron" : "✗ Hata"} · {fmtDate(c.lastSyncAt)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-soft">Henüz senkronize edilmedi</span>
                    )}
                  </div>
                  <div className="mt-1 truncate text-xs text-ink-soft">{c.importUrl}</div>
                  {c.lastSyncError && <div className="mt-1 text-xs text-red-700">{c.lastSyncError}</div>}
                </div>
                <form action={syncExternalCalendarNow}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="roomNumber" value={room.number} />
                  <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">
                    Şimdi senkronize et
                  </button>
                </form>
                <form action={deleteExternalCalendar}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="roomNumber" value={room.number} />
                  <ConfirmButton
                    message="Bu takvim bağlantısı silinsin mi?"
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                  >
                    Sil
                  </ConfirmButton>
                </form>
              </div>
            ))}
          </div>
        )}

        <form action={createExternalCalendar} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="roomNumber" value={room.number} />
          <label className="text-xs font-bold">
            Platform
            <select name="platform" className="mt-1 rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              <option value="BOOKING">Booking.com</option>
              <option value="AIRBNB">Airbnb</option>
              <option value="DIGER">Diğer</option>
            </select>
          </label>
          <label className="flex-1 text-xs font-bold">
            Takvim adresi (.ics linki)
            <input
              name="importUrl"
              placeholder="https://www.airbnb.com/calendar/ical/..."
              className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <button className="btn-primary">Ekle ve senkronize et</button>
        </form>

        {room.externalBookings.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-extrabold">Senkronize edilen dolu tarihler</h3>
            <ul className="space-y-1.5 text-sm">
              {room.externalBookings.map((b) => (
                <li key={b.id} className="flex justify-between border-b border-line pb-1.5 text-xs">
                  <span className="font-semibold">
                    {b.platform === "BOOKING" ? "Booking.com" : b.platform === "AIRBNB" ? "Airbnb" : "Diğer"}
                  </span>
                  <span className="text-ink-soft">
                    {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
