import { prisma } from "@/shared/lib/db";
import { fileResponse, jsonError } from "@/shared/lib/http";
import { can, getGuestId, getPanelSession } from "@/features/auth/guards";
import { getSiteSettings } from "@/features/content/queries";
import { generateContractPdf } from "@/features/reservations/contract";

/**
 * Sozlesme indirme. Iki tur erisim kabul edilir:
 *  - Panel oturumu (admin ya da rezervasyon/musteri yetkili personel): her sozlesme.
 *  - Misafir oturumu: yalnizca kendi rezervasyonunun sozlesmesi.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [panelSession, guestId] = await Promise.all([getPanelSession(), getGuestId()]);
  const isStaff = can(panelSession, "rezervasyonlar", "musteriler");
  if (!isStaff && !guestId) return jsonError("Bu sözleşmeyi görüntüleme yetkiniz yok.", 403);

  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { guest: true, room: { include: { type: true, assets: true } }, extraGuests: { orderBy: { createdAt: "asc" } } },
  });
  // Yetkisiz misafire kaydin var olup olmadigi da soylenmez.
  if (!reservation || (!isStaff && reservation.guestId !== guestId)) return jsonError("Rezervasyon bulunamadı.", 404);

  const pdf = await generateContractPdf({
    reservation,
    guest: reservation.guest,
    room: reservation.room,
    roomType: reservation.room.type,
    assets: reservation.room.assets,
    extraGuests: reservation.extraGuests,
    settings: await getSiteSettings(),
  });

  return fileResponse(pdf, "application/pdf", { fileName: `sozlesme-${reservation.code}.pdf`, download: true });
}
