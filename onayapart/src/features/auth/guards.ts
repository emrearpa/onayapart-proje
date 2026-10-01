import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/db";
import { SESSION_COOKIES, verifySessionToken } from "@/features/auth/session";
import { PANEL_LOGIN_PATH, parsePermissions, pathForPermission, type PermissionKey } from "@/features/auth/permissions";

export const GUEST_LOGIN_PATH = "/musteri/giris";

export type PanelSession =
  | { role: "admin"; name: string }
  | { role: "staff"; name: string; userId: string; permissions: PermissionKey[] };

/**
 * O anki panel oturumu. Personel icin izinler token'dan degil veritabanindan
 * okunur; boylece pasife alinan ya da yetkisi degisen kullanici, token suresi
 * dolmasini beklemeden aninda etkilenir. Ayni istek icinde tek kez calisir.
 */
export const getPanelSession = cache(async (): Promise<PanelSession | null> => {
  const store = cookies();

  if (await verifySessionToken("admin", store.get(SESSION_COOKIES.admin)?.value)) {
    return { role: "admin", name: "Admin" };
  }

  const staff = await verifySessionToken("staff", store.get(SESSION_COOKIES.staff)?.value);
  if (!staff) return null;

  const user = await prisma.staffUser.findUnique({
    where: { id: staff.userId },
    select: { id: true, fullName: true, permissions: true, isActive: true },
  });
  if (!user?.isActive) return null;

  return { role: "staff", name: user.fullName, userId: user.id, permissions: parsePermissions(user.permissions) };
});

/** Oturum verilen izinlerden en az birine sahip mi? Admin her zaman yetkilidir. */
export function can(session: PanelSession | null, ...anyOf: PermissionKey[]): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return anyOf.some((p) => session.permissions.includes(p));
}

/**
 * Server action ve sayfalarin ilk satiri. Oturum yoksa girise, izin yoksa
 * kullanicinin erisebildigi ilk bolume yonlendirir. Izin verilmezse yalnizca
 * oturumun varligi yeterlidir.
 */
export async function requirePanel(...anyOf: PermissionKey[]): Promise<PanelSession> {
  const session = await getPanelSession();
  if (!session) redirect(PANEL_LOGIN_PATH);
  if (anyOf.length > 0 && !can(session, ...anyOf)) {
    redirect(session.role === "staff" && session.permissions[0] ? pathForPermission(session.permissions[0]) : PANEL_LOGIN_PATH);
  }
  return session;
}

/** Yalnizca tam yetkili admin (ozluk dosyasi, kullanici yonetimi, islem gecmisi). */
export async function requireAdmin(): Promise<PanelSession> {
  const session = await getPanelSession();
  if (!session) redirect(PANEL_LOGIN_PATH);
  if (session.role !== "admin") redirect(session.permissions[0] ? pathForPermission(session.permissions[0]) : PANEL_LOGIN_PATH);
  return session;
}

export const getGuestId = cache(async (): Promise<string | null> => {
  const session = await verifySessionToken("guest", cookies().get(SESSION_COOKIES.guest)?.value);
  return session?.guestId ?? null;
});

export async function requireGuest(): Promise<string> {
  const guestId = await getGuestId();
  if (!guestId) redirect(GUEST_LOGIN_PATH);
  return guestId;
}
