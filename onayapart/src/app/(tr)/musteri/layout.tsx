import Link from "next/link";
import { guestLogout } from "@/features/guests/portal-actions";

export const metadata = { title: "Onay Apart — Müşteri Paneli", robots: { index: false, follow: false } };

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-50/50">
      <header className="border-b border-line bg-white">
        <div className="container-page flex h-16 items-center gap-3">
          <Link href="/musteri" className="flex items-center gap-2.5 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-xs text-white">OA</span>
            <span className="leading-tight">
              ONAY APART
              <span className="block text-[10px] font-medium text-ink-soft">Müşteri paneli</span>
            </span>
          </Link>
          <form action={guestLogout} className="ml-auto">
            <button className="text-sm font-bold text-ink-soft hover:text-brand-600">Çıkış yap</button>
          </form>
        </div>
      </header>
      <main className="container-page py-8">{children}</main>
    </div>
  );
}
