import { prisma } from "@/shared/lib/db";
import { jsonError } from "@/shared/lib/http";
import { can, getPanelSession } from "@/features/auth/guards";
import { serveStoredDocument } from "@/features/documents/serve";

/** Firma evraki indirme: tam admin ya da "Firma Evraklari" yetkisi olan personel. */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  if (!can(await getPanelSession(), "evraklar")) return jsonError("Bu dosyayı görüntüleme yetkiniz yok.", 403);

  return serveStoredDocument("firma", await prisma.companyDocument.findUnique({ where: { id: params.docId } }));
}
