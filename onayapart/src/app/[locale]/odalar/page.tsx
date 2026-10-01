import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCta from "@/components/FloatingCta";
import TypeCards from "@/components/TypeCards";
import RoomCard from "@/components/RoomCard";
import { getRoomTypes, getRooms } from "@/lib/queries";
import { getBatchTranslations } from "@/lib/translations";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getDictionary(params.locale);
  return { title: `${t.rooms.title} — Onay Apart`, alternates: { canonical: `/${params.locale}/odalar` } };
}

export default async function LocaleRoomsPage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale as Locale;
  const t = getDictionary(locale);
  const prefix = `/${locale}`;

  const [types, rooms] = await Promise.all([getRoomTypes(), getRooms()]);
  const typeT = await getBatchTranslations("RoomType", types.map((ty) => ty.id), locale);

  const roomWord = locale === "en" ? "Room" : locale === "ru" ? "Номер" : locale === "ar" ? "غرفة" : locale === "de" ? "Zimmer" : locale === "fr" ? "Chambre" : locale === "es" ? "Habitación" : locale === "az" ? "Otaq" : locale === "ka" ? "ოთახი" : "اتاق";
  const floorWord = locale === "en" ? " floor" : locale === "ru" ? " этаж" : locale === "ar" ? " طابق" : locale === "de" ? " Etage" : locale === "fr" ? " étage" : locale === "es" ? " piso" : locale === "az" ? " mərtəbə" : locale === "ka" ? " სართული" : " طبقه";
  const roomLabels = { room: roomWord, floor: floorWord };
  const typeCardLabels = {
    units: locale === "en" ? "units" : locale === "ru" ? "апарт." : locale === "ar" ? "شقة" : locale === "de" ? "Einheiten" : locale === "fr" ? "unités" : locale === "es" ? "unidades" : locale === "az" ? "mənzil" : locale === "ka" ? "ერთეული" : "واحد",
    available: locale === "en" ? "available" : locale === "ru" ? "свободно" : locale === "ar" ? "متاحة" : locale === "de" ? "verfügbar" : locale === "fr" ? "disponibles" : locale === "es" ? "disponibles" : locale === "az" ? "boş" : locale === "ka" ? "თავისუფალი" : "خالی",
    viewRooms: t.common.viewDetails,
    callForPrice:
      locale === "en" ? "Call for price" : locale === "ru" ? "Цена по запросу" : locale === "ar" ? "اتصل للسعر" : locale === "de" ? "Preis auf Anfrage" : locale === "fr" ? "Prix sur demande" : locale === "es" ? "Precio a consultar" : locale === "az" ? "Qiymət üçün zəng edin" : locale === "ka" ? "დარეკეთ ფასისთვის" : "برای قیمت تماس بگیرید",
  };
  const allRoomsHeading =
    locale === "en" ? "All apartments" : locale === "ru" ? "Все апартаменты" : locale === "ar" ? "جميع الشقق" : locale === "de" ? "Alle Apartments" : locale === "fr" ? "Tous les appartements" : locale === "es" ? "Todos los apartamentos" : locale === "az" ? "Bütün mənzillər" : locale === "ka" ? "ყველა ბინა" : "همه آپارتمان‌ها";

  return (
    <>
      <Header locale={locale} />
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.rooms.title}</h1>
            <p className="lede mt-3 max-w-[60ch]">{t.home.featuredRoomsSub}</p>
          </div>
        </section>

        <section className="container-page py-12">
          <TypeCards types={types} hrefPrefix={prefix} translations={typeT} labels={typeCardLabels} />
        </section>

        <section className="container-page pb-16">
          <h2 className="h2">{allRoomsHeading}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((r, i) => (
              <RoomCard key={r.id} room={r} priority={i < 4} hrefPrefix={prefix} labels={roomLabels} />
            ))}
          </div>
        </section>
      </main>
      <Footer locale={locale} />
      <FloatingCta />
    </>
  );
}
