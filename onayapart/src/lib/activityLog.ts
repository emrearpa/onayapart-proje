import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyStaffSessionToken } from "@/lib/staffAuth";

/** O anki oturumdan kimin islem yaptigini (Admin ya da hangi personel) cozer. */
export async function getCurrentActorLabel(): Promise<string> {
  try {
    const cookieStore = cookies();
    const panelCookie = cookieStore.get("oa_panel")?.value;
    const isFullAdmin =
      Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;
    if (isFullAdmin) return "Admin";

    const session = await verifyStaffSessionToken(process.env.PANEL_PASSWORD ?? "", cookieStore.get("oa_staff")?.value);
    return session ? session.fullName : "Personel";
  } catch {
    return "Personel";
  }
}

/**
 * Panelde yapilan hassas bir degisikligi (para, yetki, fiyat, rezervasyon durumu vb.)
 * kaydeder. Kim yaptigini (Admin ya da hangi personel) o anki oturumdan cikarir.
 * Loglama basarisiz olsa bile ana islemi asla bozmaz (try/catch ile sarilir).
 */
export async function logActivity(action: string, details?: string, reservationId?: string) {
  try {
    const cookieStore = cookies();
    const panelCookie = cookieStore.get("oa_panel")?.value;
    const isFullAdmin =
      Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;

    let actorType = "ADMIN";
    let actorLabel = "Admin";

    if (!isFullAdmin) {
      const session = await verifyStaffSessionToken(process.env.PANEL_PASSWORD ?? "", cookieStore.get("oa_staff")?.value);
      if (session) {
        actorType = "STAFF";
        actorLabel = session.fullName;
      } else {
        actorType = "SISTEM";
        actorLabel = "Sistem";
      }
    }

    await prisma.activityLog.create({
      data: { actorType, actorLabel, action, details: details ?? null, reservationId: reservationId ?? null },
    });
  } catch {
    // Loglama basarisiz olursa sessizce gec - kullaniciyi asla engellemesin.
  }
}
