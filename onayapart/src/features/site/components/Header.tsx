import Link from "next/link";
import { getSiteSettings } from "@/features/content/queries";
import { parseEnabledLocales, type Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { site } from "@/shared/lib/site";

export default async function Header({ locale }: { locale?: Locale } = {}) {
  const settings = await getSiteSettings();
  const prefix = locale ? `/${locale}` : "";
  const labels = getDictionary(locale).nav;

  const navItems = [
    { href: `${prefix}/odalar`, label: labels.rooms },
    ...(settings.menuEnabled ? [{ href: `${prefix}/menu`, label: labels.menu }] : []),
    { href: `${prefix}/gunluk-kiralik-apart-erzurum`, label: labels.daily },
    { href: `${prefix}/aylik-kiralik-apart-erzurum`, label: labels.monthly },
    { href: `${prefix}/erzurum-ogrenci-apart`, label: labels.student },
    { href: `${prefix}/iletisim`, label: labels.contact },
  ];

  const languages = [
    { href: "/", code: "TR", active: !locale },
    ...parseEnabledLocales(settings.enabledLocales).map((l) => ({ href: `/${l}`, code: l.toUpperCase(), active: l === locale })),
  ];
  const showLanguages = languages.length > 1;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-[72px] items-center gap-5">
        <Link href={prefix || "/"} className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 text-sm font-extrabold text-white">
            OA
          </span>
          <span className="text-[15px] font-extrabold uppercase leading-tight tracking-tight">
            {site.shortName}
            <span className="block text-[11px] font-medium normal-case tracking-wide text-ink-soft">
              {settings.addressCity} · {settings.addressDistrict}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden gap-6 text-[14.5px] font-semibold text-ink-soft lg:flex">
          {navItems.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>

        {showLanguages && (
          <div className="ml-2 hidden items-center gap-2 border-l border-line pl-3 lg:flex">
            {languages.map((l) => (
              <Link
                key={l.code}
                href={l.href}
                aria-current={l.active ? "true" : undefined}
                className={`text-xs font-bold ${l.active ? "text-brand-600" : "text-ink-soft hover:text-brand-500"}`}
              >
                {l.code}
              </Link>
            ))}
          </div>
        )}

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
        {showLanguages && (
          <span className="ml-auto flex shrink-0 gap-2 border-l border-line pl-3 text-[12px]">
            {languages.map((l) => (
              <Link key={l.code} href={l.href} className={l.active ? "text-brand-600" : ""}>
                {l.code}
              </Link>
            ))}
          </span>
        )}
      </nav>
    </header>
  );
}
