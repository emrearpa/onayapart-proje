"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/shared/components/panel/Icon";
import PanelNav, { isActiveNavItem, type NavItem } from "@/shared/components/panel/PanelNav";
import { logout } from "@/features/auth/actions";

type Props = {
  groups: NavItem[][];
  homeHref: string;
  userLabel: string;
  children: React.ReactNode;
};

const footerLink = "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left text-sm font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white";

export default function PanelShell({ groups, homeHref, userLabel, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const currentPage = useMemo(
    () => groups.flat().find((item) => isActiveNavItem(item.href, pathname))?.label ?? "Yönetim paneli",
    [groups, pathname]
  );
  const loading = navigating || isPending;

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  function navigate(href: string) {
    setDrawerOpen(false);
    if (href === pathname) return;
    setNavigating(true);
    startTransition(() => router.push(href));
  }

  const brand = (
    <Link
      href={homeHref}
      onClick={(event) => {
        if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
          event.preventDefault();
          navigate(homeHref);
        }
      }}
      className="flex min-w-0 items-center gap-3 text-white"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 text-sm font-extrabold shadow-lg shadow-brand-950/20">
        OA
      </span>
      <span className="min-w-0 font-extrabold leading-tight">
        <span className="block truncate">ONAY ERP</span>
        <span className="block truncate text-[11px] font-medium text-brand-300">{userLabel}</span>
      </span>
    </Link>
  );

  return (
    <div className="min-h-dvh bg-[#f5f8f6] lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <aside className="hidden h-dvh flex-col overflow-hidden bg-[radial-gradient(circle_at_22%_0%,rgba(78,156,118,.32),transparent_28%),linear-gradient(180deg,#0c3324_0%,#11402d_54%,#0b2d20_100%)] px-4 py-5 text-brand-100 lg:sticky lg:top-0 lg:flex">
        {brand}
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,.25)_transparent]">
          <PanelNav groups={groups} onNavigate={navigate} />
        </div>
        <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
          <Link href="/" className={footerLink}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
              <Icon name="external" className="h-4 w-4" />
            </span>
            Ana sayfaya dön
          </Link>
          <form action={logout}>
            <button className={footerLink}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">↪</span>
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line/80 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
            aria-expanded={drawerOpen}
            aria-controls="panel-mobile-menu"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-brand-700 shadow-sm transition active:scale-95"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-brand-500">ONAY ERP</p>
            <h1 className="truncate text-sm font-extrabold text-ink">{currentPage}</h1>
          </div>
          <span className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700">OA</span>
        </header>

        {drawerOpen && <button type="button" aria-label="Menüyü kapat" className="fixed inset-0 z-40 bg-ink/45 backdrop-blur-[1px] lg:hidden" onClick={() => setDrawerOpen(false)} />}
        <aside
          id="panel-mobile-menu"
          aria-label="Panel menüsü"
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(21rem,calc(100vw-2rem))] flex-col bg-[linear-gradient(180deg,#0c3324,#11402d)] px-4 py-5 text-brand-100 shadow-2xl transition-transform duration-300 lg:hidden ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {brand}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Menüyü kapat"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition active:scale-95"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <PanelNav groups={groups} className="mt-5" onNavigate={navigate} />
          </div>
          <div className="mt-4 space-y-1 border-t border-white/10 pt-4">
            <Link href="/" className={footerLink}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                <Icon name="external" className="h-4 w-4" />
              </span>
              Ana sayfaya dön
            </Link>
            <form action={logout}>
              <button className={footerLink}>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">↪</span>
                Çıkış yap
              </button>
            </form>
          </div>
        </aside>

        <main id="main-content" className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="panel-content-enter mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      {loading && (
        <div role="status" aria-live="polite" className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4">
          <div className="flex items-center gap-2 rounded-full border border-brand-200 bg-white/95 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-lg backdrop-blur">
            <Icon name="spinner" className="h-4 w-4 animate-spin" />
            Sayfa yükleniyor…
          </div>
        </div>
      )}
    </div>
  );
}
