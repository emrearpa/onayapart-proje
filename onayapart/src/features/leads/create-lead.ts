import { prisma } from "@/shared/lib/db";
import { normalizePhone } from "@/shared/lib/phone";

const LIMITS = { name: 120, phone: 30, message: 1000 };
const MIN_PHONE_DIGITS = 10;

export type LeadInput = { name?: unknown; phone?: unknown; message?: unknown; roomNumber?: unknown; website?: unknown };

/**
 * Sitedeki "Sizi arayalim" formundan gelen talebi dogrulayip kaydeder.
 * `website` gorunmez bir tuzak alandir (honeypot): insanlar gormez, botlar doldurur.
 * Doluysa talep sessizce yok sayilir.
 */
export async function createLead(input: LeadInput): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof input.website === "string" && input.website.trim()) return { ok: true };

  const name = String(input.name ?? "").trim().slice(0, LIMITS.name);
  const phone = String(input.phone ?? "").trim().slice(0, LIMITS.phone);
  if (name.length < 2 || normalizePhone(phone).length < MIN_PHONE_DIGITS) {
    return { ok: false, error: "Ad ve geçerli bir telefon numarası zorunlu." };
  }

  const roomNumber = Number(input.roomNumber);
  await prisma.lead.create({
    data: {
      name,
      phone,
      message: String(input.message ?? "").trim().slice(0, LIMITS.message) || null,
      roomNumber: Number.isInteger(roomNumber) && roomNumber > 0 ? roomNumber : null,
    },
  });
  return { ok: true };
}
