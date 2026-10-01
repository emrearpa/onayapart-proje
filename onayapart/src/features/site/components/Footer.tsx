import Link from "next/link";
import { getSiteSettings } from "@/features/content/queries";
import { getBatchTranslations, withFallback } from "@/features/content/translations";
import { getRoomTypeLinks } from "@/features/rooms/queries";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { fullAddress, site, waLink } from "@/shared/lib/site";

const TR_LABELS = {
  rooms: "Odalar",
  allRooms: "Tüm daireler",
  stays: "Konaklama",
  daily: "Günlük kiralık apart",
  monthly: "Aylık kiralık apart",
  student: "Öğrenci apart",
  faq: "Sıkça sorulan sorular",
  contact: "İletişim",
  whatsapp: "WhatsApp ile yazın",
  staff: "Personel Girişi",
  rights: "Tüm hakları saklıdır.",
};

function labelsFor(locale?: Locale): typeof TR_LABELS {
  if (!locale) return TR_LABELS;
  const t = getDictionary(locale);
  return {
    rooms: t.nav.rooms,
    allRooms: t.common.viewAll,
    stays: t.rooms.title,
    daily: t.nav.daily,
    monthly: t.nav.monthly,
    student: t.nav.student,
    faq: t.home.faqTitle,
    contact: t.nav.contact,
    whatsapp: t.common.whatsapp,
    staff: "Staff",
    rights: t.footer.rightsReserved,
  };
}

export default async function Footer({ locale }: { locale?: Locale } = {}) {
  const [settings, roomTypes] = await Promise.all([getSiteSettings(), getRoomTypeLinks()]);
  const typeNames = locale ? await getBatchTranslations("RoomType", roomTypes.map((t) => t.id), locale) : {};
  const L = labelsFor(locale);
  const prefix = locale ? `/${locale}` : "";

  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-extrabold">OA</span>
            <span className="font-extrabold uppercase">{site.name}</span>
          </div>
          <p className="mt-4 max-w-[34ch] text-sm text-brand-200">{fullAddress(settings)}</p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{L.rooms}</h2>
          <ul className="space-y-2 text-sm">
            {roomTypes.map((type) => (
              <li key={type.id}>
                <Link href={`${prefix}/odalar/${type.slug}`} className="hover:text-white">
                  {withFallback(type.name, typeNames[type.id]?.name)}
                </Link>
              </li>
            ))}
            <li>
              <Link href={`${prefix}/odalar`} className="hover:text-white">
                {L.allRooms}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{L.stays}</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href={`${prefix}/gunluk-kiralik-apart-erzurum`} className="hover:text-white">{L.daily}</Link></li>
            <li><Link href={`${prefix}/aylik-kiralik-apart-erzurum`} className="hover:text-white">{L.monthly}</Link></li>
            <li><Link href={`${prefix}/erzurum-ogrenci-apart`} className="hover:text-white">{L.student}</Link></li>
            <li><Link href={`${prefix}/sss`} className="hover:text-white">{L.faq}</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">{L.contact}</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:${settings.phoneHref}`} className="hover:text-white">
                {settings.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                {L.whatsapp}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-brand-200">
          <span>
            © {new Date().getFullYear()} {site.name} — {L.rights}
          </span>
          <Link href="/panel/giris" rel="nofollow" className="text-brand-300/70 hover:text-white">
            {L.staff}
          </Link>
        </div>
      </div>
    </footer>
  );
}
