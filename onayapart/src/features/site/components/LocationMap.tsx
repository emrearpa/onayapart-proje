import { mapsEmbedUrl, site } from "@/shared/lib/site";

type Address = { addressStreet: string; addressDistrict: string; addressCity: string };

/** Isletme adresini gosteren gomulu Google haritasi (API anahtari gerektirmez). */
export default function LocationMap({ address, className = "aspect-[16/11]" }: { address: Address; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-line bg-brand-50 ${className}`}>
      <iframe
        src={mapsEmbedUrl(address)}
        title={`${site.name} — ${address.addressDistrict}/${address.addressCity}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full border-0"
      />
    </div>
  );
}
