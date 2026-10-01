import type { Metadata } from "next";

// Giris ekrani dahil tum /panel sayfalari arama motorlarina kapalidir.
// Oturum kontrolu ve menu, (app)/layout.tsx icindedir.
export const metadata: Metadata = { title: "Onay ERP", robots: { index: false, follow: false } };

export default function PanelRootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
