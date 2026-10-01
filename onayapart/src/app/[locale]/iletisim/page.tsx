import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import LeadForm from "@/components/LeadForm";
import { fullAddress, mapsLink } from "@/lib/site";
import { getSiteSettings } from "@/lib/queries";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getDictionary(params.locale);
  return { title: `${t.nav.contact} — Onay Apart`, alternates: { canonical: `/${params.locale}/iletisim` } };
}

export default async function LocaleContactPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);

  const settings = await getSiteSettings();

  const intro =
    locale === "en"
      ? "Reach out with any questions about availability, pricing or length of stay. We respond quickly during the day."
      : locale === "ru"
        ? "Свяжитесь с нами по любым вопросам о наличии, ценах и сроках проживания. Мы отвечаем быстро в течение дня."
        : locale === "ar"
          ? "تواصلوا معنا لأي استفسار عن التوفر والأسعار ومدة الإقامة. نرد بسرعة خلال اليوم."
          : "برای هرگونه سوال درباره موجودی، قیمت یا مدت اقامت با ما تماس بگیرید. در طول روز سریع پاسخ می‌دهیم.";
  const addressLabel = t.footer.address;
  const openInMaps =
    locale === "en" ? "Open in Google Maps" : locale === "ru" ? "Открыть в Google Картах" : locale === "ar" ? "افتح في خرائط جوجل" : locale === "de" ? "In Google Maps öffnen" : locale === "fr" ? "Ouvrir dans Google Maps" : locale === "es" ? "Abrir en Google Maps" : locale === "az" ? "Google Xəritələrdə aç" : locale === "ka" ? "გახსენით Google რუქებში" : "باز کردن در گوگل مپ";

  return (
    <>
      <Header locale={locale} />
      <main className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.nav.contact}</h1>
          <p className="lede mt-3 max-w-[60ch]">{intro}</p>

          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="font-bold">{t.common.phone}</dt>
              <dd>
                <a href={`tel:${settings.phoneHref}`} className="text-brand-600 hover:underline">
                  {settings.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">WhatsApp</dt>
              <dd>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" className="text-brand-600 hover:underline">
                  {t.common.whatsapp}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">{addressLabel}</dt>
              <dd className="text-ink-soft">{fullAddress(settings)}</dd>
            </div>
          </dl>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            <div className="grid aspect-[16/9] place-items-center bg-[repeating-linear-gradient(0deg,#e0e9e3_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,#e0e9e3_0_1px,transparent_1px_42px)]">
              <a href={mapsLink(settings)} target="_blank" rel="noopener" className="btn-primary">
                {openInMaps}
              </a>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LeadForm phoneDisplay={settings.phoneDisplay} labels={t.lead} />
        </aside>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
