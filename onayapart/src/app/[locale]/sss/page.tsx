import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import { getFaqs } from "@/lib/queries";
import { getBatchTranslations, withFallback } from "@/lib/translations";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  return { alternates: { canonical: `/${params.locale}/sss` } };
}

export default async function LocaleFaqPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);

  const faqs = await getFaqs();
  const faqT = await getBatchTranslations("Faq", faqs.map((f) => f.id), locale);

  const noFaqText =
    locale === "en" ? "No questions added yet." : locale === "ru" ? "Вопросы пока не добавлены." : locale === "ar" ? "لم تتم إضافة أسئلة بعد." : locale === "de" ? "Noch keine Fragen hinzugefügt." : locale === "fr" ? "Aucune question ajoutée pour l'instant." : locale === "es" ? "Aún no se han añadido preguntas." : locale === "az" ? "Hələ sual əlavə edilməyib." : locale === "ka" ? "ჯერ არცერთი კითხვა არ არის დამატებული." : "هنوز سوالی اضافه نشده است.";

  return (
    <>
      <Header locale={locale} />
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.home.faqTitle}</h1>
          <div className="mt-8 space-y-3">
            {faqs.length === 0 && <p className="text-sm text-ink-soft">{noFaqText}</p>}
            {faqs.map((f) => (
              <details key={f.id} className="card p-5">
                <summary className="cursor-pointer font-bold">{withFallback(f.question, faqT[f.id]?.question)}</summary>
                <p className="mt-3 text-sm text-ink-soft">{withFallback(f.answer, faqT[f.id]?.answer)}</p>
              </details>
            ))}
          </div>
        </div>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
