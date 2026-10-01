import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import { getMenu, getSiteSettings } from "@/lib/queries";
import { fmtMoney } from "@/lib/dates";
import { hreflangAlternates } from "@/lib/i18n/config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Restoran Menümüz — Onay Apart Rezidans",
  description: "Onay Apart Rezidans bünyesindeki restoranın güncel menüsü, günün menüsü, fiyatlar ve içerikler.",
  alternates: { canonical: "/menu", languages: hreflangAlternates("/menu") },
};

export default async function MenuPage() {
  const [{ categories, dailySpecials }, settings] = await Promise.all([getMenu(), getSiteSettings()]);

  if (!settings.menuEnabled) notFound();

  return (
    <>
      <Header />
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Restoran menümüz</h1>
          <p className="lede mt-3">
            Onay Apart Rezidans bünyesindeki restoranımızın menüsü. Odanıza sipariş için resepsiyonu arayabilirsiniz.
          </p>

          {dailySpecials.length > 0 && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/60">
              <div className="bg-gold-500 px-5 py-2.5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">Bugünün Menüsü</h2>
              </div>
              <ul className="divide-y divide-gold-200 px-5">
                {dailySpecials.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <div className="font-bold">{item.name}</div>
                      {item.description && <p className="mt-1 text-sm text-ink-soft">{item.description}</p>}
                    </div>
                    <div className="shrink-0 font-extrabold text-gold-700">{fmtMoney(item.price)}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {categories.length === 0 ? (
            <p className="mt-8 text-sm text-ink-soft">Menü yakında burada olacak.</p>
          ) : (
            <div className="mt-10 space-y-8">
              {categories.map((cat) => (
                <section key={cat.id}>
                  <h2 className="text-xl font-extrabold tracking-tight text-brand-700">{cat.name}</h2>
                  <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
                    {cat.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 p-4">
                        <div>
                          <div className="font-semibold">{item.name}</div>
                          {item.description && <p className="mt-1 text-sm text-ink-soft">{item.description}</p>}
                        </div>
                        <div className="shrink-0 font-extrabold">{fmtMoney(item.price)}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <p className="mt-10 text-sm text-ink-soft">
            Sipariş ve rezervasyon için bizi arayabilirsiniz:{" "}
            <a href={`tel:${settings.phoneHref}`} className="font-bold text-brand-600">
              {settings.phoneDisplay}
            </a>
          </p>
        </div>
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
