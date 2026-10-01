import type { Metadata } from "next";
import Header from "@/shared/components/Header";
import Footer from "@/shared/components/Footer";
import FloatingCta from "@/shared/components/FloatingCta";
import TypeCards from "@/features/rooms/components/TypeCards";
import RoomCard from "@/features/rooms/components/RoomCard";
import { getRoomTypes, getRooms } from "@/features/rooms/queries";
import { hreflangAlternates } from "@/shared/i18n/config";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Odalarımız — Erzurum Apart Daire Listesi",
  description:
    "Onay Apart Rezidans'ın Erzurum Yakutiye'deki tüm apart daireleri: 1+0 stüdyo, 1+1 ve 2+1 daireler, oda numarası ve müsaitlik durumu ile.",
  alternates: { canonical: "/odalar", languages: hreflangAlternates("/odalar") },
};

export default async function RoomsPage() {
  const [types, rooms] = await Promise.all([getRoomTypes(), getRooms()]);

  return (
    <>
      <Header />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Erzurum apart dairelerimiz</h1>
            <p className="lede mt-3 max-w-[60ch]">
              Toplam {rooms.length} daire yayında. Bir oda tipine girerek o tipteki daireleri karşılaştırabilir,
              tek tek fotoğraflarını inceleyebilirsiniz.
            </p>
          </div>
        </section>

        <section className="container-page py-12">
          <TypeCards types={types} />
        </section>

        <section className="container-page pb-16">
          <h2 className="h2">Tüm daireler</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((r, i) => (
              <RoomCard key={r.id} room={r} priority={i < 4} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
      <FloatingCta />
    </>
  );
}
