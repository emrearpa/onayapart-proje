import { prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import ConfirmButton from "@/shared/components/ConfirmButton";
import TranslationFields from "@/features/content/components/TranslationFields";
import { getBatchRecordTranslations } from "@/features/content/translations";
import {
  createMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuVisibility,
} from "@/features/menu/actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  "kategori-eklendi": "Kategori eklendi.",
  "urun-eklendi": "Ürün eklendi.",
  guncellendi: "Ürün güncellendi.",
  silindi: "Silindi.",
  gorunurluk: "Görünürlük ayarı kaydedildi.",
};
const ERRORS: Record<string, string> = {
  "kategori-eksik": "Kategori adı zorunludur.",
  "urun-eksik": "Ürün adı ve kategori zorunludur.",
};

export default async function MenuAdminPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const [categories, settings] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sort: "asc" }, include: { items: { orderBy: { sort: "asc" } } } }),
    prisma.siteSetting.findUnique({ where: { id: "main" } }),
  ]);
  const menuEnabled = settings?.menuEnabled ?? false;

  const allItems = categories.flatMap((c) => c.items);
  const itemTranslations = await getBatchRecordTranslations("MenuItem", allItems.map((item) => item.id));

  const dailySpecialCount = categories.reduce((s, c) => s + c.items.filter((i) => i.isDailySpecial).length, 0);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Restoran Menüsü</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Burada girdiğiniz kategoriler, ürünler ve fiyatlar sitedeki{" "}
        <a href="/menu" target="_blank" rel="noopener" className="font-bold text-brand-600 hover:underline">
          /menu
        </a>{" "}
        sayfasına ve ana sayfadaki restoran bölümüne otomatik yansır. Bir ürünü &quot;Günün Menüsü&quot; olarak
        işaretlerseniz, sitede ayrı ve öne çıkan bir bölümde gösterilir.
      </p>

      <section className="card mt-5 overflow-hidden p-0">
        <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${menuEnabled ? "bg-brand-50" : "bg-slate-50"}`}>
          <div>
            <h2 className="font-extrabold tracking-tight">Restoran bölümü sitede görünsün mü?</h2>
            <p className="text-xs text-ink-soft">
              Kapalıyken menü sayfası, ana sayfadaki restoran bölümü ve üst menüdeki &quot;Menü&quot; linki hiç
              görünmez. İçeriği hazırlamaya devam edebilir, hazır olunca açabilirsiniz.
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              menuEnabled ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {menuEnabled ? "Açık" : "Kapalı"}
          </span>
        </div>
        <form action={updateMenuVisibility} className="flex items-center gap-3 p-5">
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" name="menuEnabled" defaultChecked={menuEnabled} className="h-4 w-4" />
            Restoran/menü bölümünü sitede göster
          </label>
          <button className="btn-primary">Kaydet</button>
        </form>
      </section>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok] ?? "Kaydedildi."}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {dailySpecialCount === 0 && categories.length > 0 && (
        <p className="mt-4 rounded-xl bg-gold-50 p-4 text-sm font-semibold text-gold-700">
          Henüz Günün Menüsü olarak işaretlenmiş bir ürün yok — sitede o bölüm boş görünecek.
        </p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-4 font-extrabold tracking-tight">Yeni kategori ekle</h2>
        <form action={createMenuCategory} className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-bold">
            Kategori adı
            <input name="name" placeholder="Örn. Ana Yemekler, İçecekler" className="mt-1 w-64 rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <button className="btn-primary">Ekle</button>
        </form>
      </section>

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-ink-soft">Henüz kategori yok, yukarıdan ekleyin.</p>
      ) : (
        <div className="mt-5 space-y-4">
          {categories.map((cat) => (
            <section key={cat.id} className="card p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-extrabold tracking-tight">{cat.name}</h2>
                <form action={deleteMenuCategory}>
                  <input type="hidden" name="id" value={cat.id} />
                  <ConfirmButton
                    message={`"${cat.name}" kategorisi ve içindeki tüm ürünler silinsin mi?`}
                    className="text-xs font-bold text-red-700 hover:underline"
                  >
                    Kategoriyi sil
                  </ConfirmButton>
                </form>
              </div>

              {cat.items.length > 0 && (
                <div className="mb-3 space-y-2">
                  {cat.items.map((item) => (
                    <details key={item.id} className="rounded-xl border border-line">
                      <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-xs text-ink-soft">{fmtMoney(item.price)}</span>
                        {item.isDailySpecial && (
                          <span className="rounded-full bg-gold-50 px-2 py-0.5 text-[10px] font-bold text-gold-700">Günün Menüsü</span>
                        )}
                        {!item.isAvailable && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Pasif</span>
                        )}
                      </summary>
                      <div className="border-t border-line p-4">
                        <form action={updateMenuItem} className="grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="id" value={item.id} />
                          <input name="name" defaultValue={item.name} className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2" />
                          <textarea
                            name="description"
                            defaultValue={item.description ?? ""}
                            placeholder="İçerik / açıklama (örn. malzemeler)"
                            rows={2}
                            className="rounded-lg border border-line px-3 py-2 text-sm sm:col-span-2"
                          />
                          <label className="text-xs font-bold">
                            Fiyat (₺)
                            <input name="price" type="number" min={0} step={1} defaultValue={item.price} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" />
                          </label>
                          <div className="flex flex-col justify-center gap-1.5">
                            <label className="flex items-center gap-2 text-xs font-bold">
                              <input type="checkbox" name="isAvailable" defaultChecked={item.isAvailable} className="h-4 w-4" />
                              Menüde görünsün
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold">
                              <input type="checkbox" name="isDailySpecial" defaultChecked={item.isDailySpecial} className="h-4 w-4" />
                              Günün Menüsü
                            </label>
                          </div>
                          <div className="sm:col-span-2">
                            <TranslationFields
                              fields={[
                                { name: "name", label: "Ürün adı" },
                                { name: "description", label: "İçerik / açıklama", type: "textarea" },
                              ]}
                              existing={itemTranslations[item.id]}
                            />
                          </div>
                          <div className="flex items-end gap-2 sm:col-span-2">
                            <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                          </div>
                        </form>
                        <form action={deleteMenuItem} className="mt-2">
                          <input type="hidden" name="id" value={item.id} />
                          <ConfirmButton message={`"${item.name}" silinsin mi?`} className="text-xs font-bold text-red-700 hover:underline">
                            Bu ürünü sil
                          </ConfirmButton>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <form action={createMenuItem} className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
                <input type="hidden" name="categoryId" value={cat.id} />
                <label className="text-xs font-bold">
                  Ürün adı
                  <input name="name" className="mt-1 w-40 rounded-lg border border-line px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold">
                  İçerik (isteğe bağlı)
                  <input name="description" className="mt-1 w-52 rounded-lg border border-line px-3 py-2 text-sm" />
                </label>
                <label className="text-xs font-bold">
                  Fiyat (₺)
                  <input name="price" type="number" min={0} step={1} className="mt-1 w-24 rounded-lg border border-line px-3 py-2 text-sm" />
                </label>
                <button className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-600">+ Ürün ekle</button>
              </form>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
