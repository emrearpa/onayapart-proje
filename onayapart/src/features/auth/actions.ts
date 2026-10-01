"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/shared/lib/db";
import { str } from "@/shared/lib/form";
import { SESSION_COOKIES, createSessionToken, isAdminPassword, sessionCookieOptions } from "@/features/auth/session";
import { verifyPassword } from "@/features/auth/password";
import { PANEL_LOGIN_PATH, parsePermissions, pathForPermission } from "@/features/auth/permissions";
import { clearAttempts, consumeAttempt } from "@/shared/lib/rate-limit";

export async function login(formData: FormData) {
  if (!consumeAttempt("admin")) redirect(`${PANEL_LOGIN_PATH}?hata=cok-deneme`);

  // Sifre ham haliyle okunur (trim edilmez).
  const password = String(formData.get("password") ?? "");
  if (!(await isAdminPassword(password))) redirect(`${PANEL_LOGIN_PATH}?hata=1`);

  clearAttempts("admin");
  const store = cookies();
  store.set(SESSION_COOKIES.admin, await createSessionToken("admin", {}), sessionCookieOptions("admin"));
  store.delete(SESSION_COOKIES.staff);
  redirect("/panel");
}

/** Sinirli yetkili personel girisi. Basariliysa imzali bir oturum cerezi yazar. */
export async function staffLogin(formData: FormData) {
  const failure = `${PANEL_LOGIN_PATH}?hata=personel`;
  if (!consumeAttempt("staff")) redirect(`${PANEL_LOGIN_PATH}?hata=cok-deneme`);

  const username = str(formData, "username").toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = username ? await prisma.staffUser.findUnique({ where: { username } }) : null;
  if (!user || !user.isActive) redirect(failure);
  if (!(await verifyPassword(password, user.passwordSalt, user.passwordHash))) redirect(failure);

  const permissions = parsePermissions(user.permissions);
  if (permissions.length === 0) redirect(failure);

  clearAttempts("staff");
  const store = cookies();
  store.set(
    SESSION_COOKIES.staff,
    await createSessionToken("staff", { userId: user.id, fullName: user.fullName, permissions }),
    sessionCookieOptions("staff")
  );
  store.delete(SESSION_COOKIES.admin);

  await prisma.staffUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  redirect(pathForPermission(permissions[0]));
}

export async function logout() {
  const store = cookies();
  store.delete(SESSION_COOKIES.admin);
  store.delete(SESSION_COOKIES.staff);
  redirect(PANEL_LOGIN_PATH);
}
