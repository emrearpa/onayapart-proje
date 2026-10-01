import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import TypeCards from "@/components/TypeCards";
import RoomCard from "@/components/RoomCard";
import JsonLd from "@/components/JsonLd";
import { getRoomTypes, getRooms, getSiteSettings, getAmenities, getFaqs, getMenu, getTestimonials } from "@/lib/queries";
import { fullAddress, mapsLink } from "@/lib/site";
import { fmtMoney } from "@/lib/dates";

export const revalidate = 300;

export default async function HomePage() {
  const [types, rooms, settings, amenities, faqs, menu, testimonials] = await Promise.all([
    getRoomTypes(),
    getRooms(),
    getSiteSettings(),
    getAmenities(),
    getFaqs(true),
    getMenu(),
    getTestimonials(),
  ]);

  const featured = rooms.slice(0, 8);
  const roomCount = types.reduce((s, t) => s + t.rooms.length, 0);

  return (
    <>
      <Header />

      <main>
        <section className="border-b border-line bg-gradient-to-b from-brand-50 to-white">
          <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-bold text-brand-600">
                {settings.heroEyebrow}
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                {settings.heroTitle}
              </h1>

              <p className="mt-4 max-w-[54ch] text-[17px] text-ink-soft">{settings.heroIntro}</p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/odalar" className="btn-primary">
                  Odaları ve müsaitliği gör
                </Link>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" className="btn-wa">
                  WhatsApp&apos;tan sorun
                </a>
              </div>

              <dl className="mt-9 flex flex-wrap gap-7">
                {[
                  [String(roomCount), "Apart daire"],
                  [String(types.length), "Oda tipi"],
                  ["7/24", "Güvenlik"],
                  [settings.addressDistrict, `${settings.addressCity} merkez`],
                ].map(([v, l]) => (
                  <div key={l} className="border-l-[3px] border-brand-300 pl-3">
                    <dt className="text-xl font-extrabold tracking-tight">{v}</dt>
                    <dd className="text-xs text-ink-soft">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
              {settings.heroImageUrl ? (
                <div className="relative aspect-[4/3]">
                  <Image
                    src={settings.heroImageUrl}
                    alt="Onay Apart Rezidans bina dış cephesi"
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-brand-700 via-brand-500 to-brand-300 text-center text-white">
                  <div>
                    <div className="text-5xl">🏢</div>
                    <strong className="mt-2 block text-lg">Onay Apart Rezidans</strong>
                    <p className="mt-1 text-sm text-white/80">Bina dış cephe fotoğrafı buraya gelecek</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between gap-3 px-5 py-4 text-[13px] text-ink-soft">
                <span>{settings.addressStreet}</span>
                <span>{settings.addressPostalCode} {settings.addressDistrict}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page py-16">
          <div className="max-w-2xl">
            <h2 className="h2">1+0, 1+1 ve 2+1 apart dairelerimiz</h2>
            <p className="lede mt-3">
              Oda tipini seçin, o tipteki tüm daireleri numarası ve fotoğraflarıyla tek tek inceleyin. Müsaitlik durumu
              rezervasyon sistemimizden anlık olarak gelir.
            </p>
          </div>
          <div className="mt-8">
            <TypeCards types={types} />
          </div>
        </section>

        <section className="border-y border-line bg-brand-50/60 py-16">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="h2">Dairelerimizden bir seçki</h2>
                <p className="lede mt-3">Her daire kendi sayfasında; oda numarası, katı, metrekaresi ve fotoğraflarıyla.</p>
              </div>
              <Link href="/odalar" className="btn-outline">
                Tüm daireleri gör
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((r, i) => (
                <RoomCard key={r.id} room={r} priority={i < 4} />
              ))}
            </div>
          </div>
        </section>

        {settings.menuEnabled && (menu.dailySpecials.length > 0 || menu.categories.length > 0) && (
          <section className="border-y border-line bg-brand-900 py-16 text-white">
            <div className="container-page grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-gold-500">Onay Apart Restoran</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">Bünyemizdeki restoranımızdan afiyetle</h2>
                <p className="mt-3 text-white/70">
                  Konakladığınız süre boyunca odanıza sipariş verebilir ya da restoranımızda oturup yiyebilirsiniz.
                  Güncel menümüzü ve günün özel lezzetlerini görün.
                </p>
                <Link href="/menu" className="btn-primary mt-5 inline-block">
                  Menüyü görüntüle
                </Link>
              </div>

              {menu.dailySpecials.length > 0 && (
                <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-gold-500">Bugünün Menüsü</h3>
                  <ul className="mt-3 divide-y divide-white/10">
                    {menu.dailySpecials.slice(0, 4).map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="font-semibold">{item.name}</span>
                        <span className="shrink-0 font-extrabold text-gold-400">{fmtMoney(item.price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="container-page py-16">
          <div className="max-w-2xl">
            <h2 className="h2">Apart dairelerimizde neler var?</h2>
            <p className="lede mt-3">
              Tüm dairelerimiz eşyalı ve beyaz eşyalıdır; internet dahildir. Erzurum kışına uygun ısıtma altyapısı
              bulunur.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {amenities.map((a) => (
              <li key={a.id} className="card px-4 py-4 text-sm font-semibold">
                {a.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-line bg-brand-50/60 py-16">
          <div className="container-page grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="h2">Erzurum Yakutiye&apos;de merkezi konum</h2>
              <p className="lede mt-3">{fullAddress(settings)}</p>
              <p className="mt-4 text-sm text-ink-soft">
                Çarşıya, toplu ulaşım duraklarına ve şehir merkezine yürüme mesafesindeyiz. Palandöken kayak merkezine
                ve Atatürk Üniversitesi&apos;ne ulaşım için yönlendirme sağlıyoruz.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={mapsLink(settings)} target="_blank" rel="noopener" className="btn-primary">
                  Yol tarifi alın
                </a>
                <a href={`tel:${settings.phoneHref}`} className="btn-outline">
                  {settings.phoneDisplay}
                </a>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-line bg-white">
              <div className="grid aspect-[16/11] place-items-center bg-[repeating-linear-gradient(0deg,#e0e9e3_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,#e0e9e3_0_1px,transparent_1px_42px)]">
                <span className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card">
                  📍 Onay Apart Rezidans
                </span>
              </div>
              <p className="px-4 py-3 text-xs text-ink-soft">
                Google Haritalar gömülü haritası yayına alınırken buraya yerleştirilecek.
              </p>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="border-y border-line bg-white py-16">
            <div className="container-page">
              <div className="max-w-2xl">
                <h2 className="h2">Misafirlerimiz ne diyor?</h2>
                <p className="lede mt-3">Google Haritalar&apos;daki gerçek misafir yorumlarımızdan bazıları.</p>
              </div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-line bg-brand-50/30 p-6">
                    <div className="text-gold-500" aria-hidden>
                      {"★".repeat(t.rating)}
                      {"☆".repeat(5 - t.rating)}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{t.text}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white">
                        {t.authorName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div className="text-sm font-bold">{t.authorName}</div>
                        <div className="text-xs text-ink-soft">Google Haritalar</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="container-page py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="h2">Sıkça sorulan sorular</h2>
            <div className="mt-8 space-y-3">
              {faqs.map((f) => (
                <details key={f.id} className="card p-5">
                  <summary className="cursor-pointer font-bold">{f.question}</summary>
                  <p className="mt-3 text-sm text-ink-soft">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingCta />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }}
      />
    </>
  );
}
