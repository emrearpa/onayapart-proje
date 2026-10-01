import { prisma } from "@/shared/lib/db";
import { serveStoredDocument } from "@/features/documents/serve";

/**
 * Firma evrakinin DISARIYA (WhatsApp/e-posta ile) paylasilan linki. Karsi taraf
 * (muhasebeci, resmi kurum vb.) panel kullanicisi olmadigi icin giris gerektirmez;
 * guvenlik, adresteki kimligin tahmin edilemez olmasina dayanir - bir bulut
 * deposunun "linke sahip olan gorur" paylasimi gibi. Linki yalnizca personel uretir.
 */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  return serveStoredDocument("firma", await prisma.companyDocument.findUnique({ where: { id: params.docId } }));
}
