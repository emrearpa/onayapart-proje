import { getSiteSettings } from "@/lib/queries";

export default async function FloatingCta() {
  const settings = await getSiteSettings();

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 print:hidden">
      <a
        href={`https://wa.me/${settings.whatsapp}`}
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp ile yazın"
        className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#1f9d55] text-xl text-white shadow-card"
      >
        💬
      </a>
      <a
        href={`tel:${settings.phoneHref}`}
        aria-label="Telefonla arayın"
        className="grid h-[52px] w-[52px] place-items-center rounded-full bg-brand-600 text-xl text-white shadow-card"
      >
        📞
      </a>
    </div>
  );
}
