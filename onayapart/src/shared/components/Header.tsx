import Link from "next/link";
import { getSiteSettings } from "@/features/content/queries";
import { localeConfig, parseEnabledLocales, type Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";

const trNav = [
  { href: "/odalar", label: "Odalarımız" },
  { href: "/gunluk-kiralik-apart-erzurum", label: "Günlük" },
  { href: "/aylik-kiralik-apart-erzurum", label: "Aylık" },
  { href: "/erzurum-ogrenci-apart", label: "Öğrenci" },
  { href: "/iletisim", label: "İletişim" },
];

export default async function Header({ locale }: { locale?: Locale } = {}) {
  const settings = await getSiteSettings();
  const prefix = locale ? `/${locale}` : "";
  const enabledLocales = parseEnabledLocales(settings.enabledLocales);

  const nav = locale
    ? (() => {
        const t = getDictionary(locale);
        return [
          { href: `${prefix}/odalar`, label: t.nav.rooms },
          { href: `${prefix}/gunluk-kiralik-apart-erzurum`, label: t.nav.daily },
          { href: `${prefix}/aylik-kiralik-apart-erzurum`, label: t.nav.monthly },
          { href: `${prefix}/erzurum-ogrenci-apart`, label: t.nav.student },
          { href: `${prefix}/iletisim`, label: t.nav.contact },
        ];
      })()
    : trNav;

  const navItems = settings.menuEnabled
    ? locale
      ? [nav[0], { href: `${prefix}/menu`, label: getDictionary(locale).nav.menu }, ...nav.slice(1)]
      : [trNav[0], { href: "/menu", label: "Menü" }, ...trNav.slice(1)]
    : nav;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center gap-5">
        <Link href={locale ? `/${locale}` : "/"} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-sm font-extrabold text-white">
            OA
          </span>
          <span className="text-[15px] font-extrabold leading-tight tracking-tight">
            ONAY APART
            <span className="block text-[11px] font-medium tracking-wide text-ink-soft">Erzurum · Yakutiye</span>
          </span>
        </Link>

        <nav className="ml-auto hidden gap-6 text-[14.5px] font-semibold text-ink-soft lg:flex">
          {navItems.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-2 hidden items-center gap-2 border-l border-line pl-3 lg:flex">
          <Link
            href="/"
            className={`text-xs font-bold ${!locale ? "text-brand-600" : "text-ink-soft hover:text-brand-500"}`}
          >
            TR
          </Link>
          {enabledLocales.map((l) => (
            <Link
              key={l}
              href={`/${l}`}
              className={`text-xs font-bold ${locale === l ? "text-brand-600" : "text-ink-soft hover:text-brand-500"}`}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>

        <a href={`tel:${settings.phoneHref}`} className="btn-primary ml-auto lg:ml-0">
          {settings.phoneDisplay}
        </a>
      </div>

      <nav className="flex items-center gap-4 overflow-x-auto border-t border-line px-5 py-2 text-[13.5px] font-semibold text-ink-soft lg:hidden">
        {navItems.map((n) => (
          <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-brand-500">
            {n.label}
          </Link>
        ))}
        <span className="ml-auto flex shrink-0 gap-2 border-l border-line pl-3 text-[12px]">
          <Link href="/" className={!locale ? "text-brand-600" : ""}>
            TR
          </Link>
          {enabledLocales.map((l) => (
            <Link key={l} href={`/${l}`} className={locale === l ? "text-brand-600" : ""}>
              {l.toUpperCase()}
            </Link>
          ))}
        </span>
      </nav>
    </header>
  );
}
