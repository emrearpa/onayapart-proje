import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/queries";
import { generateContractPdf } from "@/lib/contract";

/**
 * Sozlesme indirme. Iki turlu erisim kabul edilir:
 *  - Panel cookie'si (oa_panel) dogruysa: herhangi bir rezervasyonun sozlesmesi indirilebilir (admin).
 *  - Musteri cookie'si (oa_guest) varsa: sadece kendi rezervasyonunun sozlesmesi indirilebilir.
 * Ikisi de yoksa/eslesmiyorsa 403 doner.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: params.id },
    include: { guest: true, room: { include: { type: true, assets: true } }, extraGuests: { orderBy: { createdAt: "asc" } } },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });
  }

  const cookieStore = cookies();
  const panelCookie = cookieStore.get("oa_panel")?.value;
  const isAdmin = Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;
  const guestId = cookieStore.get("oa_guest")?.value;
  const isOwner = Boolean(guestId) && guestId === reservation.guestId;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Bu sözleşmeyi görüntüleme yetkiniz yok." }, { status: 403 });
  }

  const settings = await getSiteSettings();

  const pdfBytes = await generateContractPdf({
    reservation: {
      code: reservation.code,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      stayType: reservation.stayType,
      totalAmount: reservation.totalAmount,
      deposit: reservation.deposit,
      createdAt: reservation.createdAt,
    },
    guest: {
      fullName: reservation.guest.fullName,
      phone: reservation.guest.phone,
      email: reservation.guest.email,
      idType: reservation.guest.idType,
      idNumber: reservation.guest.idNumber,
      birthDate: reservation.guest.birthDate,
      nationality: reservation.guest.nationality,
      address: reservation.guest.address,
    },
    room: { number: reservation.room.number, floor: reservation.room.floor, m2: reservation.room.m2 },
    roomType: { name: reservation.room.type.name, code: reservation.room.type.code },
    assets: reservation.room.assets.map((a) => ({ name: a.name, quantity: a.quantity })),
    extraGuests: reservation.extraGuests.map((eg) => ({ fullName: eg.fullName, idType: eg.idType, idNumber: eg.idNumber })),
    settings: {
      phoneDisplay: settings.phoneDisplay,
      addressStreet: settings.addressStreet,
      addressDistrict: settings.addressDistrict,
      addressCity: settings.addressCity,
      addressPostalCode: settings.addressPostalCode,
    },
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sozlesme-${reservation.code}.pdf"`,
    },
  });
}
