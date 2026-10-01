import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildRoomExportIcs } from "@/lib/calendarSync";

/**
 * Bir odanin kendi rezervasyon takvimini .ics olarak disari verir.
 * Booking.com / Airbnb bu adresi "harici takvim ice aktar" alanina yapistirir.
 * Token, odaya ozel tahmin edilemeyen bir anahtardir - giris gerektirmez ama link bilinmeden erisilemez.
 */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const room = await prisma.room.findUnique({ where: { icalExportToken: params.token } });
  if (!room) {
    return NextResponse.json({ error: "Takvim bulunamadı." }, { status: 404 });
  }

  const ics = await buildRoomExportIcs(room.id);
  if (!ics) {
    return NextResponse.json({ error: "Takvim oluşturulamadı." }, { status: 404 });
  }

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="oda-${room.number}.ics"`,
    },
  });
}
