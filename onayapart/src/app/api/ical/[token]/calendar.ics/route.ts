import { prisma } from "@/shared/lib/db";
import { fileResponse, jsonError } from "@/shared/lib/http";
import { buildRoomExportIcs } from "@/features/calendar-sync/sync";

export const dynamic = "force-dynamic";

/**
 * Bir odanin kendi rezervasyon takvimini .ics olarak disari verir.
 * Booking.com / Airbnb bu adresi "harici takvim ice aktar" alanina yapistirir.
 * Token odaya ozel, tahmin edilemeyen bir anahtardir; giris gerektirmez.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const room = await prisma.room.findUnique({ where: { icalExportToken: params.token }, select: { id: true, number: true } });
  const ics = room ? await buildRoomExportIcs(room.id) : null;
  if (!room || !ics) return jsonError("Takvim bulunamadı.", 404);

  return fileResponse(ics, "text/calendar; charset=utf-8", { fileName: `oda-${room.number}.ics` });
}
