import type { Metadata } from "next";
import { site } from "@/shared/lib/site";

// Giris ekrani dahil tum /musteri sayfalari arama motorlarina kapalidir.
export const metadata: Metadata = { title: `${site.shortName} — Müşteri Paneli`, robots: { index: false, follow: false } };

export default function GuestRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
