"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type LinkItem = { href: string; label: string };
type LanguageItem = { href: string; code: string; active: boolean };

function FlagIcon({ code }: { code: string }) {
  const base = "h-5 w-7 shrink-0 overflow-hidden rounded-[3px] shadow-sm";

  if (code === "TR") {
    return <svg aria-hidden viewBox="0 0 28 20" className={base}><rect width="28" height="20" fill="#e30a17" /><circle cx="11.2" cy="10" r="5.2" fill="white" /><circle cx="12.9" cy="10" r="4.25" fill="#e30a17" /><path d="m17.1 6.6.9 2.05 2.22.2-1.68 1.46.5 2.18-1.94-1.13-1.94 1.13.5-2.18-1.68-1.46 2.22-.2z" fill="white" /></svg>;
  }
  if (code === "EN") {
    return <svg aria-hidden viewBox="0 0 28 20" className={base}><rect width="28" height="20" fill="#173f7a" /><path d="m0 1.6 2.1-1.6L28 18.4V20h-2.1L0 1.6Zm28 0L25.9 0 0 18.4V20h2.1L28 1.6Z" fill="white" /><path d="m0 3.4 4.4-3.4h2L0 4.9v-1.5ZM28 16.6 23.6 20h-2l6.4-4.9v1.5ZM28 3.4 23.6 0h-2L28 4.9V3.4ZM0 16.6 4.4 20h2L0 15.1v1.5Z" fill="#c8102e" /><path d="M11 0h6v7h11v6H17v7h-6v-7H0V7h11z" fill="white" /><path d="M12.4 0h3.2v8.4H28v3.2H15.6V20h-3.2v-8.4H0V8.4h12.4z" fill="#c8102e" /></svg>;
  }
  if (code === "AR") {
    return <svg aria-hidden viewBox="0 0 28 20" className={base}><rect width="28" height="20" fill="#006c35" /><path d="M7 10h14" stroke="white" strokeWidth="1.4" strokeLinecap="round" /><path d="m10 13 1.3 1.1L14 11.3l2.7 2.8L18 13" fill="none" stroke="white" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 15.5h12" stroke="white" strokeWidth="1" strokeLinecap="round" /></svg>;
  }
  if (code === "FA") {
    return <svg aria-hidden viewBox="0 0 28 20" className={base}><rect width="28" height="6.67" fill="#239f40" /><rect y="6.67" width="28" height="6.66" fill="white" /><rect y="13.33" width="28" height="6.67" fill="#da0000" /><path d="M14 7.8v4.4m-2.1-2.2h4.2" stroke="#da0000" strokeWidth="1" /></svg>;
  }
  if (code === "RU") {
    return <svg aria-hidden viewBox="0 0 28 20" className={base}><rect width="28" height="6.67" fill="white" /><rect y="6.67" width="28" height="6.66" fill="#0039a6" /><rect y="13.33" width="28" height="6.67" fill="#d52b1e" /></svg>;
  }
  return <span aria-hidden className="grid h-5 w-7 place-items-center rounded-[3px] bg-brand-100 text-[10px] font-extrabold text-brand-700">{code}</span>;
}

function LanguagePicker({ languages, onSelect, mobile = false }: { languages: LanguageItem[]; onSelect: (href: string) => void; mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const activeLanguage = languages.find((language) => language.active) ?? languages[0];

  if (!activeLanguage) return null;

  return (
    <div className={`relative ${mobile ? "w-full" : ""}`}>
      <button
        type="button"
        aria-label={`Dil seçimi: ${activeLanguage.code}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex cursor-pointer items-center justify-start gap-2 rounded-xl border border-line bg-white font-extrabold text-brand-700 outline-none transition hover:border-brand-300 focus:border-brand-500 ${
          mobile ? "w-full px-3 py-3 text-sm" : "px-3 py-2 text-xs"
        }`}
      >
        <FlagIcon code={activeLanguage.code} />
        <span>{activeLanguage.code}</span>
        <span aria-hidden className="ml-auto text-[10px]">⌄</span>
      </button>
      {open && (
        <div className={`absolute z-[70] overflow-hidden rounded-xl border border-line bg-white p-1 shadow-xl ${mobile ? "left-0 right-0 top-[calc(100%+.5rem)]" : "right-0 top-[calc(100%+.5rem)] w-36"}`}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(language.href);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-bold transition ${
                language.active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
              }`}
            >
              <FlagIcon code={language.code} />
              <span>{language.code}</span>
              {language.active && <span className="ml-auto text-brand-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  navItems: LinkItem[];
  languages: LanguageItem[];
  homeHref: string;
  siteName: string;
  cityLabel: string;
  phoneDisplay: string;
  phoneHref: string;
};

function isActive(href: string, pathname: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export default function SiteHeaderNav({ navItems, languages, homeHref, siteName, cityLabel, phoneDisplay, phoneHref }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const showLanguages = languages.length > 1;

  useEffect(() => {
    setMenuOpen(false);
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function navigate(href: string) {
    setMenuOpen(false);
    if (href === pathname) return;
    setNavigating(true);
    startTransition(() => router.push(href));
  }

  function navigationClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  }

  const brand = (
    <Link href={homeHref} onClick={(event) => navigationClick(event, homeHref)} className="flex min-w-0 items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-800 text-sm font-extrabold text-white shadow-lg shadow-brand-900/20">
        OA
      </span>
      <span className="min-w-0 text-[15px] font-extrabold uppercase leading-tight tracking-tight text-ink">
        <span className="block truncate">{siteName}</span>
        <span className="block truncate text-[11px] font-medium normal-case tracking-wide text-ink-soft">{cityLabel}</span>
      </span>
    </Link>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 shadow-[0_1px_0_rgba(12,51,36,.03)] backdrop-blur-xl">
        <div className="container-page flex h-16 items-center gap-3 lg:h-20 lg:gap-6">
          {brand}

          <nav aria-label="Ana menü" className="ml-auto hidden items-center gap-1 xl:flex">
            {navItems.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={(event) => navigationClick(event, item.href)}
                  className={`rounded-full px-4 py-2.5 text-[15px] font-bold transition ${
                    active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {showLanguages && (
            <div className="hidden border-l border-line pl-3 xl:block">
              <LanguagePicker languages={languages} onSelect={navigate} />
            </div>
          )}

          <Link
            href="/panel/giris"
            onClick={(event) => navigationClick(event, "/panel/giris")}
            className="hidden rounded-full border border-brand-200 px-3 py-2 text-xs font-extrabold text-brand-700 transition hover:bg-brand-50 xl:inline-flex"
          >
            Yönetici girişi
          </Link>
          <a href={`tel:${phoneHref}`} className="hidden rounded-full bg-brand-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-800 xl:inline-flex">
            {phoneDisplay}
          </a>
          <a href={`tel:${phoneHref}`} aria-label={phoneDisplay} className="ml-auto grid h-10 w-10 place-items-center rounded-xl bg-brand-700 text-lg text-white xl:hidden">
            <span aria-hidden>☎</span>
          </a>
          <button
            type="button"
            aria-label="Menüyü aç"
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            onClick={() => setMenuOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-brand-700 shadow-sm transition active:scale-95 xl:hidden"
          >
            <span className="h-4 w-5 border-y-2 border-current before:mb-[5px] before:block before:border-t-2 before:content-['']" />
          </button>
        </div>
      </header>

      {menuOpen && <button type="button" aria-label="Menüyü kapat" className="fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-[1px] xl:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        id="site-mobile-menu"
        aria-label="Ana menü"
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col bg-white px-5 py-5 shadow-2xl transition-transform duration-300 xl:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
          {brand}
          <button type="button" aria-label="Menüyü kapat" onClick={() => setMenuOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl font-medium text-brand-700">
            ×
          </button>
        </div>
        <nav aria-label="Mobil ana menü" className="mt-5 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={(event) => navigationClick(event, item.href)}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold transition ${
                  active ? "bg-brand-700 text-white shadow-sm" : "text-ink hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                {item.label}
                <span aria-hidden className="text-lg font-normal">›</span>
              </Link>
            );
          })}
        </nav>
        {showLanguages && (
          <div className="mt-6 border-t border-line pt-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[.14em] text-ink-soft">Dil seçimi</p>
            <div className="mt-3">
              <LanguagePicker languages={languages} onSelect={navigate} mobile />
            </div>
          </div>
        )}
        <Link href="/panel/giris" onClick={(event) => navigationClick(event, "/panel/giris")} className="mt-6 flex items-center justify-center rounded-xl border border-brand-200 bg-brand-50 px-4 py-3.5 text-sm font-extrabold text-brand-700">
          Yönetici girişi
        </Link>
        <a href={`tel:${phoneHref}`} className="mt-3 flex items-center justify-center rounded-xl bg-brand-700 px-4 py-3.5 text-sm font-bold text-white">
          {phoneDisplay} ile ara
        </a>
      </aside>

      {(navigating || isPending) && (
        <div role="status" aria-live="polite" className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-brand-200 bg-white/95 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-lg backdrop-blur">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            Sayfa yükleniyor…
          </div>
        </div>
      )}
    </>
  );
}
