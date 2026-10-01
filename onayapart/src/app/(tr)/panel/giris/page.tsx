import Link from "next/link";
import { login, staffLogin } from "@/features/auth/actions";
import LoginTabs from "@/features/auth/components/LoginTabs";
import Icon from "@/shared/components/panel/Icon";

export const metadata = { title: "Panel girişi", robots: { index: false } };

export default function LoginPage({ searchParams }: { searchParams: { hata?: string } }) {
  const initialTab = searchParams.hata === "personel" ? "personel" : "admin";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-brand-900 via-brand-900 to-[#081f16] px-5 py-12">
      {/* Sicak, resepsiyon-isigi hissi veren tek bir altin parlama - tasarimdaki tek "cesur" oge */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, #c9a227 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-500/30 bg-white/5 text-gold-500">
            <Icon name="door" className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">Onay Apart</h1>
          <p className="mt-1 text-sm font-medium text-white/50">Erzurum Yakutiye · Yönetim girişi</p>
        </div>

        <LoginTabs
          login={login}
          staffLogin={staffLogin}
          initialTab={initialTab}
          adminError={searchParams.hata === "1"}
          staffError={searchParams.hata === "personel"}
        />

        <Link
          href="/musteri/giris"
          className="group mt-4 flex items-center gap-4 rounded-2xl border border-gold-500/25 bg-white/[0.06] p-5 backdrop-blur-sm transition hover:border-gold-500/50 hover:bg-white/[0.1]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-400 transition group-hover:bg-gold-500/25">
            <Icon name="key" className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-white">Misafir misiniz?</span>
            <span className="block text-xs text-white/55">Rezervasyonunuza, bakiyenize ve WiFi bilginize buradan ulaşın</span>
          </span>
        </Link>
      </div>
    </main>
  );
}
