import { prisma } from "@/lib/db";

/** Telefon numarasini WhatsApp'in bekledigi uluslararasi formata cevirir (orn. 905306527088). */
export function normalizePhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1); // 0530... -> 530...
  if (digits.length === 10) digits = "90" + digits; // TR numarasi varsayimi
  return digits;
}

/** Sablon metnindeki {ad} {oda} {tutar} {tarih} {kod} yer tutucularini doldurur. */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (match, key) => vars[key] ?? match);
}

/** Tek tikla acilan hazir mesaj linki (API yapilandirilmamissa kullanilir). */
export function buildWaLink(phone: string, body: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(body)}`;
}

export async function getIntegrationSettings() {
  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  if (existing) return existing;
  return prisma.integrationSetting.create({ data: { id: "main" } });
}

export type SendResult = {
  status: "GONDERILDI" | "LINK_HAZIRLANDI" | "HATA";
  link?: string;
  errorMessage?: string;
};

/**
 * Mesaji gonderir. WhatsApp Business API bilgileri girilmisse Meta Cloud API uzerinden
 * gercekten gonderir; girilmemisse gonderim yapmaz, tek tikla acilacak bir link dondurur.
 *
 * NOT: Meta Cloud API, musteri size son 24 saat icinde yazmadiysa serbest metin mesaja
 * izin vermez; bu durumda onceden onaylatilmis bir sablon (template) gerekir. Onayli
 * sablonunuz varsa asagidaki istegi "type: template" olacak sekilde guncellememiz gerekir.
 */
export async function sendWhatsappMessage(phone: string, body: string): Promise<SendResult> {
  const settings = await getIntegrationSettings();
  const to = normalizePhone(phone);

  if (!to) return { status: "HATA", errorMessage: "Geçersiz telefon numarası." };

  if (!settings.waEnabled || !settings.waAccessToken || !settings.waPhoneNumberId) {
    return { status: "LINK_HAZIRLANDI", link: buildWaLink(phone, body) };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${settings.waPhoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${settings.waAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: false, body },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { status: "HATA", errorMessage: errText.slice(0, 300), link: buildWaLink(phone, body) };
    }

    return { status: "GONDERILDI" };
  } catch (e) {
    return {
      status: "HATA",
      errorMessage: e instanceof Error ? e.message.slice(0, 300) : "Bilinmeyen hata",
      link: buildWaLink(phone, body),
    };
  }
}
