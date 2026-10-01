import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import { getMenu, getSiteSettings } from "@/lib/queries";
import { fmtMoney } from "@/lib/dates";
import { getBatchTranslations, withFallback } from "@/lib/translations";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getDictionary(params.locale);
  return { title: `${t.nav.menu} — Onay Apart`, alternates: { canonical: `/${params.locale}/menu` } };
}

export default async function LocaleMenuPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);

  const [{ categories, dailySpecials }, settings] = await Promise.all([getMenu(), getSiteSettings()]);
  if (!settings.menuEnabled) notFound();

  const allItems = [...dailySpecials, ...categories.flatMap((c) => c.items)];
  const [categoryT, itemT] = await Promise.all([
    getBatchTranslations("MenuCategory", categories.map((c) => c.id), locale),
    getBatchTranslations("MenuItem", allItems.map((i) => i.id), locale),
  ]);

  const introText =
    locale === "en"
      ? "The restaurant inside Onay Apart Rezidans. Call reception to order to your room."
      : locale === "ru"
        ? "Ресторан в Onay Apart Rezidans. Позвоните на ресепшн, чтобы заказать в номер."
        : locale === "ar"
          ? "مطعم داخل أوناي أبارتريزيدانس. اتصل بالاستقبال للطلب إلى غرفتك."
          : "رستوران داخل اونای آپارت رزیدانس. برای سفارش به اتاق با پذیرش تماس بگیرید.";
  const comingSoon =
    locale === "en" ? "Menu coming soon." : locale === "ru" ? "Меню скоро появится." : locale === "ar" ? "القائمة ستتوفر قريباً." : locale === "de" ? "Speisekarte folgt in Kürze." : locale === "fr" ? "Le menu arrive bientôt." : locale === "es" ? "El menú estará disponible pronto." : locale === "az" ? "Menyu tezliklə əlavə olunacaq." : locale === "ka" ? "მენიუ მალე დაემატება." : "منو به‌زودی اضافه می‌شود.";
  const orderCallText =
    locale === "en"
      ? "Call us for orders and reservations:"
      : locale === "ru"
        ? "Звоните для заказа и бронирования:"
        : locale === "ar"
          ? "اتصل بنا للطلب والحجز:"
          : "برای سفارش و رزرو با ما تماس بگیرید:";

  return (
    <>
      <Header locale={locale} />
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.nav.menu}</h1>
          <p className="lede mt-3">{introText}</p>

          {dailySpecials.length > 0 && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/60">
              <div className="bg-gold-500 px-5 py-2.5">
                <h2 className="text-sm font-extrabold uppercase tracking-wide text-white">{t.home.dailySpecial}</h2>
              </div>
              <ul className="divide-y divide-gold-200 px-5">
                {dailySpecials.map((item) => {
                  const tr = itemT[item.id];
                  const name = withFallback(item.name, tr?.name);
                  const description = withFallback(item.description ?? "", tr?.description);
                  return (
                    <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                      <div>
                        <div className="font-bold">{name}</div>
                        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
                      </div>
                      <div className="shrink-0 font-extrabold text-gold-700">{fmtMoney(item.price)}</div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {categories.length === 0 ? (
            <p className="mt-8 text-sm text-ink-soft">{comingSoon}</p>
          ) : (
            <div className="mt-10 space-y-8">
              {categories.map((cat) => (
                <section key={cat.id}>
                  <h2 className="text-xl font-extrabold tracking-tight text-brand-700">
                    {withFallback(cat.name, categoryT[cat.id]?.name)}
                  </h2>
                  <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
                    {cat.items.map((item) => {
                      const tr = itemT[item.id];
                      const name = withFallback(item.name, tr?.name);
                      const description = withFallback(item.description ?? "", tr?.description);
                      return (
                        <li key={item.id} className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <div className="font-semibold">{name}</div>
                            {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
                          </div>
                          <div className="shrink-0 font-extrabold">{fmtMoney(item.price)}</div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <p className="mt-10 text-sm text-ink-soft">
            {orderCallText}{" "}
            <a href={`tel:${settings.phoneHref}`} className="font-bold text-brand-600">
              {settings.phoneDisplay}
            </a>
          </p>
        </div>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
