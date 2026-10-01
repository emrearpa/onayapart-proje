import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (name.length < 2 || phone.length < 7) {
      return NextResponse.json({ error: "Ad ve telefon zorunlu." }, { status: 400 });
    }

    await prisma.lead.create({
      data: {
        name,
        phone,
        message: String(body.message ?? "").slice(0, 1000) || null,
        roomNumber: body.roomNumber ? Number(body.roomNumber) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Talep kaydedilemedi." }, { status: 500 });
  }
}
