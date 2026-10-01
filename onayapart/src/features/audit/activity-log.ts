import { prisma } from "@/shared/lib/db";
import { getPanelSession } from "@/features/auth/guards";

async function currentActor(): Promise<{ actorType: string; actorLabel: string }> {
  try {
    const session = await getPanelSession();
    if (session?.role === "admin") return { actorType: "ADMIN", actorLabel: "Admin" };
    if (session?.role === "staff") return { actorType: "STAFF", actorLabel: session.name };
  } catch {
    // Istek baglami disinda (orn. cron) cagrildiysa oturum okunamaz.
  }
  return { actorType: "SISTEM", actorLabel: "Sistem" };
}

/** O anki oturumdan kimin islem yaptigini (Admin ya da hangi personel) cozer. */
export async function getCurrentActorLabel(): Promise<string> {
  return (await currentActor()).actorLabel;
}

/**
 * Panelde yapilan hassas bir degisikligi (para, yetki, fiyat, rezervasyon durumu vb.)
 * kaydeder. Loglama basarisiz olsa bile ana islemi asla bozmaz.
 */
export async function logActivity(action: string, details?: string, reservationId?: string) {
  try {
    const actor = await currentActor();
    await prisma.activityLog.create({
      data: { ...actor, action, details: details ?? null, reservationId: reservationId ?? null },
    });
  } catch (error) {
    console.error("[activity-log] kayit yazilamadi:", error);
  }
}
