import type { Metadata } from "next";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site } from "@/shared/lib/site";
import { pageAlternates } from "@/features/content/seo";
import RoomCard from "@/features/rooms/components/RoomCard";
import TypeCards from "@/features/rooms/components/TypeCards";
import { getRoomTypes, getRooms } from "@/features/rooms/queries";
import SiteShell from "@/features/site/components/SiteShell";

const PATH = "/odalar";

export async function roomsMetadata(locale?: Locale): Promise<Metadata> {
  const t = getDictionary(locale);
  return {
    title: `${t.rooms.title} — ${site.shortName}`,
    description: t.home.featuredRoomsSub,
    alternates: await pageAlternates(PATH, locale),
  };
}

export default async function RoomsView({ locale }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const [types, rooms] = await Promise.all([getRoomTypes(), getRooms()]);

  return (
    <SiteShell locale={locale}>
      <main>
        <section className="border-b border-line bg-brand-50/60">
          <div className="container-page py-12">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.rooms.title}</h1>
            <p className="lede mt-3 max-w-[60ch]">{t.home.featuredRoomsSub}</p>
          </div>
        </section>

        <section className="container-page py-12">
          <TypeCards types={types} locale={locale} />
        </section>

        <section className="container-page pb-16">
          <h2 className="h2">
            {t.ui.allApartments} <span className="text-ink-soft">({rooms.length})</span>
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {rooms.map((room, i) => (
              <RoomCard key={room.id} room={room} priority={i < 4} locale={locale} />
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
