import { prisma } from "@/shared/lib/db";
import ConfirmButton from "@/shared/components/ConfirmButton";
import TranslationFields from "@/features/content/components/TranslationFields";
import { getBatchRecordTranslations, type FieldTranslations } from "@/features/content/translations";
import type { Locale } from "@/shared/i18n/config";
import { createRoomType, updateRoomType, deleteRoomType } from "@/features/rooms/actions";
import { requirePanel } from "@/features/auth/guards";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  eklendi: "Oda tipi eklendi.",
  guncellendi: "Oda tipi güncellendi.",
  silindi: "Oda tipi silindi.",
};
const ERRORS: Record<string, string> = {
  eksik: "Kod, adres uzantısı (slug) ve isim zorunludur.",
  cakisma: "Bu kod veya adres uzantısı zaten kullanılıyor.",
  dolu: "Bu tipte hâlâ daire var. Önce daireleri başka tipe taşıyın veya silin.",
};

export default async function RoomTypesPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  await requirePanel("odalar");
  const types = await prisma.roomType.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { rooms: true } } },
  });
  const typeTranslations = await getBatchRecordTranslations("RoomType", types.map((t) => t.id));

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Oda tipleri</h1>
      <p className="mt-1 text-sm text-ink-soft">
        1+0, 1+1, 2+1 gibi tipleri buradan siz yönetiyorsunuz — yeni bir tip mi açtınız, artık kullanmıyor musunuz,
        hepsi bu ekrandan.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">{MESSAGES[searchParams.ok]}</p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Yeni oda tipi ekle</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Örnek: 3+1 daireniz varsa kod &quot;3+1&quot;, adres uzantısı &quot;3-1-apart-daire&quot; şeklinde girin.
        </p>
        <TypeForm action={createRoomType} />
      </section>

      <section className="mt-5 space-y-4">
        {types.length === 0 && (
          <p className="text-sm text-ink-soft">Henüz oda tipi yok. Yukarıdan ilk tipi oluşturun.</p>
        )}

        {types.map((t) => (
          <details key={t.id} className="card p-5">
            <summary className="cursor-pointer font-extrabold tracking-tight">
              {t.name} <span className="font-normal text-ink-soft">— {t._count.rooms} daire</span>
            </summary>

            <div className="mt-5">
              <TypeForm action={updateRoomType} type={t} existing={typeTranslations[t.id]} />

              <form action={deleteRoomType} className="mt-4 border-t border-line pt-4">
                <input type="hidden" name="id" value={t.id} />
                <ConfirmButton
                  message={`"${t.name}" tipini silmek istediğinize emin misiniz?`}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Bu tipi sil
                </ConfirmButton>
                {t._count.rooms > 0 && (
                  <span className="ml-3 text-xs text-ink-soft">
                    Silmek için önce bu tipteki {t._count.rooms} daireyi başka tipe taşıyın veya silin.
                  </span>
                )}
              </form>
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}

function TypeForm({
  action,
  type,
  existing,
}: {
  action: (formData: FormData) => void;
  type?: {
    id: string;
    code: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    seoTitle: string;
    seoText: string;
    minM2: number;
    maxM2: number;
    capacity: string;
    features: string;
    imageUrl: string | null;
  };
  existing?: Record<Locale, FieldTranslations>;
}) {
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {type && <input type="hidden" name="id" value={type.id} />}

      <label className="text-xs font-bold">
        Kod (örn. 1+1)
        <input name="code" defaultValue={type?.code} required className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold">
        Adres uzantısı (slug)
        <input name="slug" defaultValue={type?.slug} required placeholder="1-1-apart-daire" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Görünen isim
        <input name="name" defaultValue={type?.name} required placeholder="1+1 Apart Daire" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Kısa tanıtım cümlesi
        <input name="tagline" defaultValue={type?.tagline} placeholder="Ayrı yatak odalı, en çok tercih edilen tipimiz" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Açıklama (site kartlarında görünür)
        <textarea name="description" defaultValue={type?.description} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold">
        Min m²
        <input name="minM2" type="number" min={0} defaultValue={type?.minM2 ?? 0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>
      <label className="text-xs font-bold">
        Maks m²
        <input name="maxM2" type="number" min={0} defaultValue={type?.maxM2 ?? 0} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Kapasite (örn. 2–3 kişi)
        <input name="capacity" defaultValue={type?.capacity} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Özellikler (her satıra bir tane)
        <textarea name="features" defaultValue={type?.features} rows={4} placeholder={"Ayrı yatak odası\nSalon ve açık mutfak\nÇamaşır makinesi"} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        Tanıtım kartı fotoğrafı (dosya adresi/link, isteğe bağlı)
        <input
          name="imageUrl"
          defaultValue={type?.imageUrl ?? ""}
          placeholder="https://..."
          className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
        />
        <span className="mt-1 block text-[11px] font-normal text-ink-soft">
          Boş bırakılırsa ana sayfadaki oda tipi kartında yeşil gradyan + kod (örn. 2+1) görünür.
        </span>
      </label>

      <div className="sm:col-span-2">
        <TranslationFields
          fields={[
            { name: "name", label: "Görünen isim" },
            { name: "tagline", label: "Kısa tanıtım cümlesi" },
            { name: "description", label: "Açıklama", type: "textarea" },
            { name: "capacity", label: "Kapasite" },
            { name: "features", label: "Özellikler (her satıra bir tane)", type: "textarea", rows: 4 },
          ]}
          existing={existing}
        />
      </div>

      <label className="text-xs font-bold sm:col-span-2">
        SEO başlığı (Google&apos;da görünür)
        <input name="seoTitle" defaultValue={type?.seoTitle} placeholder="Erzurum 1+1 Apart Daire" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <label className="text-xs font-bold sm:col-span-2">
        SEO tanıtım metni (oda tipi sayfasının altında görünür)
        <textarea name="seoText" defaultValue={type?.seoText} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
      </label>

      <div className="sm:col-span-2">
        <button className="btn-primary">{type ? "Değişiklikleri kaydet" : "Oda tipini oluştur"}</button>
      </div>
    </form>
  );
}
