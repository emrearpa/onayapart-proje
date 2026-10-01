import type { Locale } from "@/shared/i18n/config";
import FloatingCta from "@/features/site/components/FloatingCta";
import Footer from "@/features/site/components/Footer";
import Header from "@/features/site/components/Header";

/** Herkese acik sayfalarin ortak cercevesi: ust menu, icerik, altbilgi ve hizli iletisim dugmeleri. */
export default function SiteShell({ children, locale }: { children: React.ReactNode; locale?: Locale }) {
  return (
    <>
      <Header locale={locale} />
      {children}
      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
