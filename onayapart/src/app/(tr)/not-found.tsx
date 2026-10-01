import Link from "next/link";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container-page py-24 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">Aradığınız sayfa bulunamadı</h1>
        <p className="lede mt-3">Sayfa taşınmış veya daire yayından kaldırılmış olabilir.</p>
        <Link href="/odalar" className="btn-primary mt-6">
          Dairelere göz atın
        </Link>
      </main>
      <Footer />
    </>
  );
}
