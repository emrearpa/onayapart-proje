import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/shared/lib/db";

/**
 * Firma evrakinin DISARIYA (WhatsApp/e-posta ile) paylasilan linki - panel girisi
 * GEREKTIRMEZ, cunku karsi taraf (muhasebeci, resmi kurum vb.) panel kullanicisi
 * degil. Guvenlik, linkin kendisinin tahmin edilemez (rastgele) olmasindan gelir -
 * tipki bir Google Drive paylasim linki gibi. Sadece personel bu linki KENDISI
 * olusturup gonderdigi icin erisilebilir olur.
 */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const doc = await prisma.companyDocument.findUnique({ where: { id: params.docId } });
  if (!doc) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  if (doc.filePath.startsWith("http://") || doc.filePath.startsWith("https://")) {
    return NextResponse.redirect(doc.filePath);
  }

  try {
    const bytes = await readFile(path.join(process.cwd(), "private-uploads", "firma", doc.filePath));
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
