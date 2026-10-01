import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/queries";
import { getRecordTranslations, getBatchRecordTranslations } from "@/lib/translations";
import { locales, localeConfig, parseEnabledLocales } from "@/lib/i18n/config";
import ConfirmButton from "@/components/ConfirmButton";
import TranslationFields from "@/components/panel/TranslationFields";
import {
  updateSiteSettings,
  updateEnabledLocales,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  createFaq,
  updateFaq,
  deleteFaq,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../actions";

export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  iletisim: "İletişim ve ana sayfa metni güncellendi.",
  "olanak-eklendi": "Olanak eklendi.",
  "olanak-guncellendi": "Olanak güncellendi.",
  "olanak-silindi": "Olanak silindi.",
  "sss-eklendi": "Soru eklendi.",
  "sss-guncellendi": "Soru güncellendi.",
  "sss-silindi": "Soru silindi.",
  "yorum-eklendi": "Yorum eklendi.",
  "yorum-guncellendi": "Yorum güncellendi.",
  "yorum-silindi": "Yorum silindi.",
  diller: "Site dilleri güncellendi.",
};
const ERRORS: Record<string, string> = {
  "olanak-eksik": "Olanak adı ve etiketi boş bırakılamaz.",
  "olanak-cakisma": "Bu isimde bir olanak zaten var.",
  "sss-eksik": "Soru ve cevap alanları boş bırakılamaz.",
  "yorum-eksik": "İsim ve yorum metni boş bırakılamaz.",
};

export default async function ContentPage({
  searchParams,
}: {
  searchParams: { ok?: string; hata?: string };
}) {
  const [settings, amenities, faqs, testimonials] = await Promise.all([
    getSiteSettings(),
    prisma.amenity.findMany({ orderBy: { sort: "asc" } }),
    prisma.faq.findMany({ orderBy: { sort: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { sort: "asc" } }),
  ]);
  const enabledLocales = parseEnabledLocales(settings.enabledLocales);

  const heroTranslations = await getRecordTranslations("SiteSetting", "main");
  const [faqTranslations, amenityTranslations] = await Promise.all([
    getBatchRecordTranslations("Faq", faqs.map((f) => f.id)),
    getBatchRecordTranslations("Amenity", amenities.map((a) => a.id)),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Site içeriği</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Telefon, adres, ana sayfa metni, olanaklar listesi ve sıkça sorulan sorular — hepsi buradan, kod
        değiştirmeden düzenlenir. Kaydettiğinde birkaç saniye içinde sitede görünür.
      </p>

      {searchParams.ok && (
        <p className="mt-4 rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-700">
          {MESSAGES[searchParams.ok] ?? "Kaydedildi."}
        </p>
      )}
      {searchParams.hata && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {ERRORS[searchParams.hata] ?? "İşlem yapılamadı."}
        </p>
      )}

      {/* İLETİŞİM + ANA SAYFA METNİ */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">İletişim ve ana sayfa girişi</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Bu bilgiler telefon butonu, WhatsApp linki, footer ve ana sayfanın en üstündeki başlıkta kullanılır.
        </p>

        <form action={updateSiteSettings} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold">
              Telefon (görünen)
              <input name="phoneDisplay" defaultValue={settings.phoneDisplay} placeholder="0530 652 70 88" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Telefon (arama linki)
              <input name="phoneHref" defaultValue={settings.phoneHref} placeholder="+905306527088" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              WhatsApp numarası
              <input name="whatsapp" defaultValue={settings.whatsapp} placeholder="905306527088" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold sm:col-span-2">
              Adres — cadde/sokak/no
              <input name="addressStreet" defaultValue={settings.addressStreet} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              İlçe
              <input name="addressDistrict" defaultValue={settings.addressDistrict} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              İl
              <input name="addressCity" defaultValue={settings.addressCity} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Posta kodu
              <input name="addressPostalCode" defaultValue={settings.addressPostalCode} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
          </div>

          <div className="border-t border-line pt-4">
            <label className="text-xs font-bold">
              Ana sayfa üst rozet
              <input name="heroEyebrow" defaultValue={settings.heroEyebrow} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="mt-3 block text-xs font-bold">
              Ana sayfa başlığı (H1)
              <textarea name="heroTitle" defaultValue={settings.heroTitle} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="mt-3 block text-xs font-bold">
              Ana sayfa açıklama metni
              <textarea name="heroIntro" defaultValue={settings.heroIntro} rows={3} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="mt-3 block text-xs font-bold">
              Bina dış cephe fotoğrafı (dosya adresi/link)
              <input
                name="heroImageUrl"
                defaultValue={settings.heroImageUrl ?? ""}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
              />
              <span className="mt-1 block text-[11px] font-normal text-ink-soft">
                Boş bırakılırsa ana sayfada yer tutucu görünür. Bir görsel barındırma servisine (örn. imgur.com,
                Google Drive paylaşım linki, ya da kendi barındırmanız) yükleyip buraya doğrudan görsel adresini
                yapıştırın.
              </span>
            </label>
            <div className="mt-3">
              <TranslationFields
                fields={[
                  { name: "heroEyebrow", label: "Üst rozet" },
                  { name: "heroTitle", label: "Başlık (H1)", type: "textarea" },
                  { name: "heroIntro", label: "Açıklama metni", type: "textarea", rows: 3 },
                ]}
                existing={heroTranslations}
              />
            </div>
          </div>

          <div>
            <button className="btn-primary">Kaydet</button>
          </div>
        </form>
      </section>

      {/* SITE DILLERI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Sitenin dilleri</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Türkçe her zaman açıktır. Bunların dışında hangi dillerin sitede aktif olacağını seçin — işaretlemediğiniz
          diller ne dil geçiş menüsünde ne de site haritasında görünür, tamamen kapalı sayılır.
        </p>
        <form action={updateEnabledLocales} className="grid gap-2 sm:grid-cols-3">
          {locales.map((l) => (
            <label key={l} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm font-bold">
              <input type="checkbox" name={`locale_${l}`} defaultChecked={enabledLocales.includes(l)} className="h-4 w-4" />
              {localeConfig[l].nativeLabel} <span className="font-normal text-ink-soft">({localeConfig[l].label})</span>
            </label>
          ))}
          <div className="sm:col-span-3">
            <button className="btn-primary">Dilleri kaydet</button>
          </div>
        </form>
      </section>

      {/* OLANAKLAR */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Olanaklar listesi</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Ana sayfadaki genel liste ve daire ekleme ekranındaki seçim kutucukları buradan gelir. Bir olanağı silersen,
          o olanağı işaretlemiş dairelerde artık görünmez ama daire bilgisi bozulmaz.
        </p>

        <div className="mb-5 space-y-2">
          {amenities.length === 0 && <p className="text-sm text-ink-soft">Henüz olanak eklenmedi.</p>}
          {amenities.map((a) => (
            <details key={a.id} className="rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-sm font-semibold">{a.label}</summary>
              <form action={updateAmenity} className="mt-3 space-y-2 border-t border-line pt-3">
                <input type="hidden" name="id" value={a.id} />
                <input
                  name="label"
                  defaultValue={a.label}
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                />
                <TranslationFields fields={[{ name: "label", label: "Etiket" }]} existing={amenityTranslations[a.id]} />
                <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
              </form>
              <form action={deleteAmenity} className="mt-2">
                <input type="hidden" name="id" value={a.id} />
                <ConfirmButton
                  message={`"${a.label}" olanağı silinsin mi?`}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Sil
                </ConfirmButton>
              </form>
            </details>
          ))}
        </div>

        <form action={createAmenity} className="flex flex-wrap items-end gap-2 border-t border-line pt-4">
          <label className="text-xs font-bold">
            Yeni olanak etiketi
            <input
              name="label"
              placeholder="Örn. Balkon"
              className="mt-1 w-56 rounded-xl border border-line px-3 py-2.5 text-sm font-normal"
            />
          </label>
          <button className="btn-primary">Ekle</button>
        </form>
      </section>

      {/* SSS */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Sıkça sorulan sorular</h2>
        <p className="mb-4 text-sm text-ink-soft">
          &quot;Ana sayfada da göster&quot; işaretli sorular ana sayfanın altında, tamamı /sss sayfasında görünür.
        </p>

        <div className="space-y-3">
          {faqs.length === 0 && <p className="text-sm text-ink-soft">Henüz soru eklenmedi.</p>}
          {faqs.map((f) => (
            <details key={f.id} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">{f.question}</summary>
              <form action={updateFaq} className="mt-3 grid gap-2">
                <input type="hidden" name="id" value={f.id} />
                <label className="text-xs font-bold">
                  Soru
                  <input name="question" defaultValue={f.question} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="text-xs font-bold">
                  Cevap
                  <textarea name="answer" defaultValue={f.answer} rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
                </label>
                <label className="flex items-center gap-2 text-xs font-bold">
                  <input type="checkbox" name="homepage" defaultChecked={f.homepage} className="h-4 w-4" />
                  Ana sayfada da göster
                </label>
                <TranslationFields
                  fields={[
                    { name: "question", label: "Soru" },
                    { name: "answer", label: "Cevap", type: "textarea" },
                  ]}
                  existing={faqTranslations[f.id]}
                />
                <div className="flex gap-2">
                  <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                </div>
              </form>
              <form action={deleteFaq} className="mt-2">
                <input type="hidden" name="id" value={f.id} />
                <ConfirmButton
                  message="Bu soru silinsin mi?"
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Bu soruyu sil
                </ConfirmButton>
              </form>
            </details>
          ))}
        </div>

        <form action={createFaq} className="mt-5 grid gap-2 border-t border-line pt-4">
          <h3 className="text-sm font-extrabold">Yeni soru ekle</h3>
          <label className="text-xs font-bold">
            Soru
            <input name="question" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="text-xs font-bold">
            Cevap
            <textarea name="answer" rows={2} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" name="homepage" defaultChecked className="h-4 w-4" />
            Ana sayfada da göster
          </label>
          <div>
            <button className="btn-primary">Soruyu ekle</button>
          </div>
        </form>
      </section>

      {/* MUSTERI YORUMLARI */}
      <section className="card mt-5 p-5">
        <h2 className="mb-1 font-extrabold tracking-tight">Müşteri yorumları</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Google Haritalar&apos;daki gerçek yorumlardan beğendiklerinizi (genelde 5 yıldızlı olanları) buraya
          kopyala-yapıştır ile ekleyin. Otomatik bir bağlantı yok, bilerek — böylece hangi yorumun sitede
          göründüğünü siz seçersiniz ve hiçbir şey bozulmaz. Yayında olmayanlar sitede görünmez.
        </p>

        {testimonials.length > 0 ? (
          <div className="mb-5 space-y-2">
            {testimonials.map((t) => (
              <details key={t.id} className="rounded-xl border border-line">
                <summary className="flex cursor-pointer flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                  <span className="text-gold-500">{"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}</span>
                  <span className="font-semibold">{t.authorName}</span>
                  <span className="truncate text-xs text-ink-soft">— {t.text.slice(0, 60)}{t.text.length > 60 ? "…" : ""}</span>
                  {!t.isPublished && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Yayında değil</span>
                  )}
                </summary>
                <div className="border-t border-line p-4">
                  <form action={updateTestimonial} className="grid gap-2">
                    <input type="hidden" name="id" value={t.id} />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="authorName" defaultValue={t.authorName} placeholder="Ad Soyad" className="rounded-lg border border-line px-3 py-2 text-sm" />
                      <label className="flex items-center gap-2 text-xs font-bold">
                        Yıldız
                        <select name="rating" defaultValue={t.rating} className="rounded-lg border border-line px-2 py-2 text-sm">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <textarea name="text" defaultValue={t.text} rows={3} className="rounded-lg border border-line px-3 py-2 text-sm" />
                    <label className="flex items-center gap-2 text-xs font-bold">
                      <input type="checkbox" name="isPublished" defaultChecked={t.isPublished} className="h-4 w-4" />
                      Sitede yayında
                    </label>
                    <div>
                      <button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white">Kaydet</button>
                    </div>
                  </form>
                  <form action={deleteTestimonial} className="mt-2">
                    <input type="hidden" name="id" value={t.id} />
                    <ConfirmButton message={`${t.authorName} adlı yorum silinsin mi?`} className="text-xs font-bold text-red-700 hover:underline">
                      Bu yorumu sil
                    </ConfirmButton>
                  </form>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className="mb-5 text-sm text-ink-soft">Henüz yorum eklenmedi.</p>
        )}

        <form action={createTestimonial} className="grid gap-2 border-t border-line pt-4">
          <h3 className="text-sm font-extrabold">Yeni yorum ekle</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Ad Soyad
              <input name="authorName" placeholder="Örn. Ahmet Y." className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
            </label>
            <label className="text-xs font-bold">
              Yıldız
              <select name="rating" defaultValue={5} className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} yıldız
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-xs font-bold">
            Yorum metni
            <textarea name="text" rows={3} placeholder="Google'daki yorumu buraya yapıştırın" className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm font-normal" />
          </label>
          <div>
            <button className="btn-primary">Yorumu ekle</button>
          </div>
        </form>
      </section>
    </div>
  );
}
