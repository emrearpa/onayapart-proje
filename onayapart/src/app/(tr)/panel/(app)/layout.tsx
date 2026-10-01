import Link from "next/link";
import PanelNav from "@/shared/components/panel/PanelNav";
import { logout } from "@/features/auth/actions";
import { requirePanel } from "@/features/auth/guards";
import { visibleNavGroups } from "@/features/auth/panel-nav";

const FOOTER_LINK = "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePanel();
  const navGroups = visibleNavGroups(session);
  const homeHref = navGroups[0]?.[0]?.href ?? "/panel";

  return (
    <div className="min-h-screen bg-brand-50/50 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-gradient-to-b from-brand-900 via-brand-900 to-brand-800 p-5 text-brand-100">
        <Link href={homeHref} className="flex items-center gap-3 text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-extrabold shadow-sm">
            OA
          </span>
          <span className="font-extrabold leading-tight">
            ONAY ERP
            <span className="block text-[11px] font-medium text-brand-300">
              {session.role === "admin" ? "Yönetim paneli" : session.name}
            </span>
          </span>
        </Link>

        <PanelNav groups={navGroups} />

        <div className="mt-6 space-y-1 border-t border-white/10 pt-5 text-sm">
          <Link href="/" className={FOOTER_LINK}>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">🌐</span>
            Siteyi görüntüle
          </Link>
          <form action={logout}>
            <button className={FOOTER_LINK}>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">⏻</span>
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      <div className="p-5 lg:p-8">{children}</div>
    </div>
  );
}
