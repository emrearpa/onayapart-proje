import { normalizePhone } from "@/shared/lib/phone";
import { waLink } from "@/shared/lib/site";
import { getIntegrationSettings } from "@/features/integrations/settings";

const GRAPH_API_VERSION = "v21.0";
const MAX_ERROR_LENGTH = 300;

export type SendResult = {
  status: "GONDERILDI" | "LINK_HAZIRLANDI" | "HATA";
  link?: string;
  errorMessage?: string;
};

/** Tek tikla acilan hazir mesaj linki (API yapilandirilmamissa kullanilir). */
export function buildWaLink(phone: string, body: string): string {
  return waLink(normalizePhone(phone), body);
}

/**
 * Mesaji gonderir. WhatsApp Business API bilgileri girilmisse Meta Cloud API uzerinden
 * gercekten gonderir; girilmemisse gonderim yapmaz, tek tikla acilacak bir link dondurur.
 *
 * NOT: Meta Cloud API, musteri size son 24 saat icinde yazmadiysa serbest metin mesaja
 * izin vermez; bu durumda onceden onaylatilmis bir sablon (template) gerekir.
 */
export async function sendWhatsappMessage(phone: string, body: string): Promise<SendResult> {
  const to = normalizePhone(phone);
  if (!to) return { status: "HATA", errorMessage: "Geçersiz telefon numarası." };

  const settings = await getIntegrationSettings();
  const link = buildWaLink(phone, body);
  if (!settings.waEnabled || !settings.waAccessToken || !settings.waPhoneNumberId) {
    return { status: "LINK_HAZIRLANDI", link };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${settings.waPhoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${settings.waAccessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body } }),
    });
    if (res.ok) return { status: "GONDERILDI" };
    return { status: "HATA", errorMessage: (await res.text()).slice(0, MAX_ERROR_LENGTH), link };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Bilinmeyen hata";
    return { status: "HATA", errorMessage: message.slice(0, MAX_ERROR_LENGTH), link };
  }
}
