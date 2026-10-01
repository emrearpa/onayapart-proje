import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/shared/lib/db";
import { verifyStaffSessionToken } from "@/features/auth/session";
import { permissionForPath } from "@/features/auth/permissions";

/**
 * Firma evraki indirme. Panele giren, "Firma Evraklari" yetkisi olan herkes
 * (tam admin ya da sinirli yetkili personel) acabilir.
 */
export async function GET(_req: Request, { params }: { params: { docId: string } }) {
  const cookieStore = cookies();
  const panelCookie = cookieStore.get("oa_panel")?.value;
  const isFullAdmin = Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;

  if (!isFullAdmin) {
    const session = await verifyStaffSessionToken(process.env.PANEL_PASSWORD ?? "", cookieStore.get("oa_staff")?.value);
    const allowed = session?.permissions.includes(permissionForPath("/panel/evraklar") ?? "");
    if (!session || !allowed) {
      return NextResponse.json({ error: "Bu dosyayı görüntüleme yetkiniz yok." }, { status: 403 });
    }
  }

  const doc = await prisma.companyDocument.findUnique({ where: { id: params.docId } });
  if (!doc) {
    return NextResponse.json({ error: "Dosya bulunamadı." }, { status: 404 });
  }

  // Bulut deposu linki olarak eklenmis evraklar dogrudan o adrese yonlendirilir.
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
