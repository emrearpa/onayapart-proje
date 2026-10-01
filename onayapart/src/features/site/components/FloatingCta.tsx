import { getSiteSettings } from "@/features/content/queries";
import { waLink } from "@/shared/lib/site";

const BUTTON = "grid h-[52px] w-[52px] place-items-center rounded-full text-xl text-white shadow-card";

/** Ekranin kosesinde sabit duran WhatsApp ve telefon kisayollari. */
export default async function FloatingCta() {
  const settings = await getSiteSettings();

  return (
    <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 print:hidden">
      <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className={`${BUTTON} bg-[#1f9d55]`}>
        <span aria-hidden>💬</span>
      </a>
      <a href={`tel:${settings.phoneHref}`} aria-label={settings.phoneDisplay} className={`${BUTTON} bg-brand-600`}>
        <span aria-hidden>📞</span>
      </a>
    </div>
  );
}
