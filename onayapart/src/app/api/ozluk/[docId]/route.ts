import { prisma } from "@/shared/lib/db";
import { jsonError } from "@/shared/lib/http";
import { getPanelSession } from "@/features/auth/guards";
import { serveStoredDocument } from "@/features/documents/serve";

/**
 * Personel ozluk evraki indirme. Kimlik, saglik raporu gibi hassas kisisel veriler
 * icerdigi icin SADECE tam yetkili admin acabilir; sinirli yetkili personel acamaz.
 */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  if ((await getPanelSession())?.role !== "admin") return jsonError("Bu dosyayı görüntüleme yetkiniz yok.", 403);

  return serveStoredDocument("personel", await prisma.employeeDocument.findUnique({ where: { id: params.docId } }));
}
