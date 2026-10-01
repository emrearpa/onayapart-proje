import type { Metadata } from "next";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import LeadForm from "@/features/leads/components/LeadForm";
import { fullAddress, mapsLink } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { hreflangAlternates } from "@/shared/i18n/config";

export const metadata: Metadata = {
  title: "İletişim — Onay Apart Rezidans Erzurum",
  description: "Onay Apart Rezidans ile telefon, WhatsApp veya form üzerinden iletişime geçin.",
  alternates: { canonical: "/iletisim", languages: hreflangAlternates("/iletisim") },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Header />
      <main className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">İletişim</h1>
          <p className="lede mt-3 max-w-[60ch]">
            Müsaitlik, fiyat ve konaklama süresiyle ilgili tüm sorularınız için bize ulaşın. Telefonlarımıza gün içinde
            hızlıca dönüş yapıyoruz.
          </p>

          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="font-bold">Telefon</dt>
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
                  WhatsApp ile yazın
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">Adres</dt>
              <dd className="text-ink-soft">{fullAddress(settings)}</dd>
            </div>
          </dl>

          <div className="mt-8 overflow-hidden rounded-2xl border border-line">
            <div className="grid aspect-[16/9] place-items-center bg-[repeating-linear-gradient(0deg,#e0e9e3_0_1px,transparent_1px_42px),repeating-linear-gradient(90deg,#e0e9e3_0_1px,transparent_1px_42px)]">
              <a href={mapsLink(settings)} target="_blank" rel="noopener" className="btn-primary">
                Google Haritalar&apos;da açın
              </a>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LeadForm phoneDisplay={settings.phoneDisplay} />
        </aside>
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
