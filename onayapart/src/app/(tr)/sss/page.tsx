import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import JsonLd from "@/components/JsonLd";
import { getFaqs } from "@/lib/queries";
import { hreflangAlternates } from "@/lib/i18n/config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular — Erzurum Apart Konaklama",
  description:
    "Erzurum apart konaklaması hakkında sık sorulan sorular: fiyatlar, rezervasyon, depozito, öğrenci konaklaması, evcil hayvan ve otopark.",
  alternates: { canonical: "/sss", languages: hreflangAlternates("/sss") },
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  return (
    <>
      <Header />
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sıkça sorulan sorular</h1>
          <p className="lede mt-3">Erzurum apart konaklamasıyla ilgili en çok sorulanları burada topladık.</p>
          <div className="mt-8 space-y-3">
            {faqs.length === 0 && <p className="text-sm text-ink-soft">Henüz soru eklenmedi.</p>}
            {faqs.map((f) => (
              <details key={f.id} className="card p-5">
                <summary className="cursor-pointer font-bold">{f.question}</summary>
                <p className="mt-3 text-sm text-ink-soft">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
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
