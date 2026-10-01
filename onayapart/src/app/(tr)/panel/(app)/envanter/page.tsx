import { prisma } from "@/shared/lib/db";
import { getInventoryItemsWithStock } from "@/features/inventory/queries";
import { fmtDate } from "@/shared/lib/dates";
import ConfirmButton from "@/shared/components/ConfirmButton";
import StatCard from "@/shared/components/panel/StatCard";
import SearchBox from "@/shared/components/panel/SearchBox";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createLocation,
  recordStockIn,
  transferStock,
  recordStockOut,
} from "@/features/inventory/actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  TEMIZLIK: "Temizlik",
  TEKSTIL: "Tekstil (havlu/nevresim)",
  MUTFAK: "Mutfak",
  MINIBAR: "Minibar",
  DIGER: "Diğer",
};

const MESSAGES: Record<string, string> = {
  eklendi: "Stok kalemi eklendi.",
  guncellendi: "Stok kalemi güncellendi.",
  silindi: "Stok kalemi silindi.",
  hareket: "Stok hareketi kaydedildi.",
  "konum-eklendi": "Konum eklendi.",
};
const ERRORS: Record<string, string> = {
  eksik: "Kalem adı zorunludur.",
  "konum-eksik": "Konum adı zorunludur.",
  "konum-cakisma": "Bu isimde bir konum zaten var.",
  "hareket-eksik": "Kalem, konum ve geçerli bir miktar seçmelisiniz.",
  "stok-yetersiz": "Bu kadarı çıkarılamaz — seçilen konumdaki stoktan fazla.",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string; q?: string };
}) {
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const [{ items, locations }, rooms, recentMovements] = await Promise.all([
    getInventoryItemsWithStock(),
    prisma.room.findMany({ orderBy: { number: "asc" }, select: { id: true, number: true } }),
    prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { item: true, room: true, fromLocation: true, toLocation: true },
    }),
  ]);

  const depo = locations.find((l) => l.type === "DEPO") ?? locations[0];
  const lowStock = items.filter((i) => depo && i.byLocation[depo.id] <= i.minQuantity && i.minQuantity > 0);
  const visibleItems = q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Envanter / Stok</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Havlu, nevresim, temizlik malzemesi gibi tüketilen stok kalemlerinizi konum bazlı takip edin — depoda ne
        kadar, kat hizmetlerinde ne kadar var, ayrı ayrı görünür. Bu, odalardaki demirbaşlardan (TV, buzdolabı vb.)
        farklıdır.
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
        <StatCard label="Toplam stok kalemi" value={String(items.length)} icon="receipt" tone="brand" />
        <StatCard
          label="Düşük stoklu kalem (depo)"
          value={String(lowStock.length)}
          icon="warning"
          tone={lowStock.length > 0 ? "gold" : "brand"}
        />
      </div>

      {lowStock.length > 0 && depo && (
        <section className="card mt-5 overflow-hidden border-gold-200 p-0">
          <div className="flex items-center gap-2 bg-gold-50 px-5 py-3">
            <span className="text-sm">⚠️</span>
            <h2 className="font-extrabold tracking-tight text-gold-700">Depoda düşük stok</h2>
          </div>
          <ul className="space-y-1.5 p-5 text-sm">
            {lowStock.map((i) => (
              <li key={i.id} className="flex justify-between border-b border-line pb-1.5">
                <span className="font-semibold">{i.name}</span>
                <span className="text-gold-700">
                  {i.byLocation[depo.id]} {i.unit} kaldı (minimum: {i.minQuantity})
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KONUM BAZLI STOK TABLOSU */}
      <section className="card mt-5 overflow-x-auto p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-extrabold tracking-tight">Stok durumu (konum bazlı)</h2>
          <SearchBox placeholder="Kalem adı ara..." value={searchParams.q} />
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz stok kalemi yok, aşağıdan ekleyin.</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-sm text-ink-soft">Aramanızla eşleşen kalem bulunamadı.</p>
        ) : (
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Kalem</th>
                <th className="pb-2">Kategori</th>
                {locations.map((l) => (
                  <th key={l.id} className="pb-2 text-right">
                    {l.name}
                  </th>
                ))}
                <th className="pb-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((i) => (
                <tr key={i.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 font-semibold">{i.name}</td>
                  <td className="py-2.5 text-xs text-ink-soft">{CATEGORY_LABEL[i.category] ?? i.category}</td>
                  {locations.map((l) => (
                    <td
                      key={l.id}
                      className={`py-2.5 text-right tabular-nums ${
                        l.type === "DEPO" && i.minQuantity > 0 && i.byLocation[l.id] <= i.minQuantity ? "font-bold text-gold-700" : ""
                      }`}
                    >
                      {i.byLocation[l.id]} {i.unit}
                    </td>
                  ))}
                  <td className="py-2.5 text-right font-extrabold tabular-nums">
                    {i.total} {i.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* STOK HAREKETI FORMLARI */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Depoya giriş</h2>
          <p className="mb-3 text-xs text-ink-soft">Satın alınan malzemeyi depoya ekleyin.</p>
          <form action={recordStockIn} className="grid gap-2">
            <select name="itemId" className="rounded-lg border border-line px-3 py-2 text-sm">
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <select name="locationId" defaultValue={depo?.id} className="rounded-lg border border-line px-3 py-2 text-sm">
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min={1} step={1} placeholder="Miktar" className="rounded-lg border border-line px-3 py-2 text-sm" />
            <input name="reason" placeholder="Not (isteğe bağlı)" className="rounded-lg border border-line px-3 py-2 text-sm" />
            <button className="btn-primary">Girişi kaydet</button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Konumlar arası aktar</h2>
          <p className="mb-3 text-xs text-ink-soft">Örn. depodan kat hizmetlerine malzeme verildiğinde.</p>
          <form action={transferStock} className="grid gap-2">
            <select name="itemId" className="rounded-lg border border-line px-3 py-2 text-sm">
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select name="fromLocationId" defaultValue={depo?.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
              <select name="toLocationId" defaultValue={locations.find((l) => l.type === "PERSONEL")?.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <input name="quantity" type="number" min={1} step={1} placeholder="Miktar" className="rounded-lg border border-line px-3 py-2 text-sm" />
            <button className="btn-primary">Aktarımı kaydet</button>
          </form>
        </section>

        <section className="card p-5">
          <h2 className="mb-1 font-extrabold tracking-tight">Çıkış (tüketim)</h2>
          <p className="mb-3 text-xs text-ink-soft">Kat görevlisi elindeki malzeme bittiğinde/kullanıldığında burada işaretlesin.</p>
          <form action={recordStockOut} className="grid gap-2">
            <select name="itemId" className="rounded-lg border border-line px-3 py-2 text-sm">
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <select name="fromLocationId" defaultValue={locations.find((l) => l.type === "PERSONEL")?.id} className="rounded-lg border border-line px-3 py-2 text-sm">
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min={1} step={1} placeholder="Miktar" className="rounded-lg border border-line px-3 py-2 text-sm" />
            <select name="roomId" className="rounded-lg border border-line px-3 py-2 text-sm">
              <option value="">Belirli bir daireyle ilişkilendirme</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Oda {r.number}
                </option>
              ))}
            </select>
            <input name="reason" placeholder="Not (isteğe bağlı)" className="rounded-lg border border-line px-3 py-2 text-sm" />
            <button className="btn-primary">Çıkışı kaydet</button>
          </form>
        </section>
      </div>

      {/* KALEM YONETIMI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni stok kalemi ekle</h2>
        <form action={createInventoryItem} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="text-xs font-bold xl:col-span-2">
            Kalem adı
            <input name="name" placeholder="Örn. Banyo havlusu" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Kategori
            <select name="category" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            Birim
            <input name="unit" placeholder="adet, paket, litre..." defaultValue="adet" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Minimum seviye (depo)
            <input name="minQuantity" type="number" min={0} step={1} defaultValue={0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="flex items-end">
            <button className="btn-primary w-full">Ekle</button>
          </div>
        </form>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-bold text-brand-600">+ Yeni konum ekle (Depo/Kat Hizmetleri dışında)</summary>
          <form action={createLocation} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-xs font-bold">
              Konum adı
              <input name="name" placeholder="Örn. Kat 2 Deposu" className="mt-1 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Tür
              <select name="type" className="mt-1 rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                <option value="DEPO">Depo</option>
                <option value="PERSONEL">Personel / Kat hizmetleri</option>
              </select>
            </label>
            <button className="btn-primary">Ekle</button>
          </form>
        </details>
      </section>

      {items.length > 0 && (
        <section className="card mt-5 p-5">
          <h2 className="mb-4 font-extrabold tracking-tight">Kalem bilgilerini düzenle</h2>
          {q && visibleItems.length === 0 && <p className="text-sm text-ink-soft">Aramanızla eşleşen kalem bulunamadı.</p>}
          <div className="space-y-2">
            {visibleItems.map((i) => (
              <details key={i.id} className="rounded-xl border border-line">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold">{i.name}</summary>
                <div className="border-t border-line p-4">
                  <form action={updateInventoryItem} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <input type="hidden" name="id" value={i.id} />
                    <input name="name" defaultValue={i.name} className="rounded-lg border border-line px-3 py-2 text-sm" />
                    <select name="category" defaultValue={i.category} className="rounded-lg border border-line px-3 py-2 text-sm">
                      {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <input name="unit" defaultValue={i.unit} className="rounded-lg border border-line px-3 py-2 text-sm" />
                    <input name="minQuantity" type="number" min={0} step={1} defaultValue={i.minQuantity} className="rounded-lg border border-line px-3 py-2 text-sm" />
                    <input name="note" defaultValue={i.note ?? ""} placeholder="Not" className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2 xl:col-span-3" />
                    <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                  </form>
                  <form action={deleteInventoryItem} className="mt-2">
                    <input type="hidden" name="id" value={i.id} />
                    <ConfirmButton
                      message={`"${i.name}" stok kalemi silinsin mi? Hareket geçmişi de silinir.`}
                      className="text-xs font-bold text-red-700 hover:underline"
                    >
                      Bu kalemi sil
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="card mt-5 overflow-x-auto p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Son hareketler</h2>
        {recentMovements.length === 0 ? (
          <p className="text-sm text-ink-soft">Henüz hareket yok.</p>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-soft">
                <th className="pb-2">Tarih</th>
                <th className="pb-2">Kalem</th>
                <th className="pb-2">Tür</th>
                <th className="pb-2">Miktar</th>
                <th className="pb-2">Nereden → Nereye</th>
                <th className="pb-2">Not</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.map((m) => (
                <tr key={m.id} className="border-t border-line transition hover:bg-brand-50/30">
                  <td className="py-2.5 text-xs">{fmtDate(m.createdAt)}</td>
                  <td className="py-2.5 font-semibold">{m.item.name}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        m.type === "GIRIS" ? "bg-brand-50 text-brand-600" : m.type === "CIKIS" ? "bg-danger-50 text-danger-700" : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {m.type === "GIRIS" ? "Giriş" : m.type === "CIKIS" ? "Çıkış" : "Transfer"}
                    </span>
                  </td>
                  <td className="py-2.5">
                    {m.type === "CIKIS" ? "−" : "+"}
                    {m.quantity} {m.item.unit}
                  </td>
                  <td className="py-2.5 text-xs text-ink-soft">
                    {m.fromLocation?.name ?? "—"} → {m.toLocation?.name ?? "—"}
                    {m.room ? ` · Oda ${m.room.number}` : ""}
                  </td>
                  <td className="py-2.5 text-xs text-ink-soft">{m.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
