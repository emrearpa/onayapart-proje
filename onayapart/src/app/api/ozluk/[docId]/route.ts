import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/shared/lib/db";

/**
 * Personel ozluk evraki indirme. Kimlik, saglik raporu gibi hassas kisisel veriler
 * icerdigi icin SADECE tam yetkili admin girisiyle acilabilir - sinirli yetkili
 * personel hesaplari (StaffUser) bu dosyalara erisemez.
 */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const cookieStore = cookies();
  const panelCookie = cookieStore.get("oa_panel")?.value;
  const isFullAdmin = Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;

  if (!isFullAdmin) {
    return NextResponse.json({ error: "Bu dosyayı görüntüleme yetkiniz yok." }, { status: 403 });
  }

  const doc = await prisma.employeeDocument.findUnique({ where: { id: params.docId } });
  if (!doc) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  // Bulut deposu linki olarak eklenmis evraklar dogrudan o adrese yonlendirilir.
  if (doc.filePath.startsWith("http://") || doc.filePath.startsWith("https://")) {
    return NextResponse.redirect(doc.filePath);
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), "private-uploads", "personel", doc.filePath));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya diskte bulunamadı." }, { status: 404 });
  }
}
