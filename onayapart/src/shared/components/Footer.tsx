import Link from "next/link";
import { fullAddress } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { getDictionary } from "@/shared/i18n/dictionaries";
import type { Locale } from "@/shared/i18n/config";

export default async function Footer({ locale }: { locale?: Locale } = {}) {
  const settings = await getSiteSettings();

  if (locale) {
    const t = getDictionary(locale);
    const prefix = `/${locale}`;
    return (
      <footer className="bg-brand-900 text-brand-100">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-extrabold">OA</span>
              <span className="font-extrabold">ONAY APART</span>
            </div>
            <p className="mt-4 max-w-[34ch] text-sm text-brand-200">Erzurum, Yakutiye — Onay Apart Rezidans</p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-white">{t.nav.rooms}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`${prefix}/odalar`} className="hover:text-white">
                  {t.common.viewAll}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold text-white">{t.nav.contact}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`tel:${settings.phoneHref}`} className="hover:text-white">
                  {settings.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" className="hover:text-white">
                  {t.common.whatsapp}
                </a>
              </li>
              <li className="text-brand-200">
                {t.footer.address}: {fullAddress(settings)}
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-page flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-brand-200">
            <span>
              © {new Date().getFullYear()} Onay Apart Rezidans — {t.footer.rightsReserved}
            </span>
            <Link href="/panel/giris" className="text-brand-300/70 hover:text-white">
              Staff
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-brand-900 text-brand-100">
      <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-extrabold">OA</span>
            <span className="font-extrabold">ONAY APART REZİDANS</span>
          </div>
          <p className="mt-4 max-w-[34ch] text-sm text-brand-200">
            Erzurum Yakutiye&apos;de 1+0, 1+1 ve 2+1 eşyalı apart daireler. Günlük, aylık ve öğrenci konaklaması.
          </p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">Odalar</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/odalar/1-0-studyo-apart" className="hover:text-white">1+0 Stüdyo Apart</Link></li>
            <li><Link href="/odalar/1-1-apart-daire" className="hover:text-white">1+1 Apart Daire</Link></li>
            <li><Link href="/odalar/2-1-apart-daire" className="hover:text-white">2+1 Apart Daire</Link></li>
            <li><Link href="/odalar" className="hover:text-white">Tüm daireler</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">Konaklama</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/gunluk-kiralik-apart-erzurum" className="hover:text-white">Günlük kiralık apart</Link></li>
            <li><Link href="/aylik-kiralik-apart-erzurum" className="hover:text-white">Aylık kiralık apart</Link></li>
            <li><Link href="/erzurum-ogrenci-apart" className="hover:text-white">Öğrenci apart</Link></li>
            <li><Link href="/sss" className="hover:text-white">Sıkça sorulan sorular</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-white">İletişim</h2>
          <ul className="space-y-2 text-sm">
            <li><a href={`tel:${settings.phoneHref}`} className="hover:text-white">{settings.phoneDisplay}</a></li>
            <li>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener" className="hover:text-white">
                WhatsApp ile yazın
              </a>
            </li>
            <li className="text-brand-200">{fullAddress(settings)}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-wrap justify-between gap-3 py-5 text-xs text-brand-200">
          <span>© {new Date().getFullYear()} Onay Apart Rezidans — onayapart.com</span>
          <span>Erzurum apart · Erzurum kiralık apart daire · Yakutiye apart</span>
          <Link href="/panel/giris" className="text-brand-300/70 hover:text-white">
            Personel Girişi
          </Link>
        </div>
      </div>
    </footer>
  );
}
