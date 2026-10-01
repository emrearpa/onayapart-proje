"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueViolation, prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import { checked, date, optStr, positiveNum, str, strList, uploadedFile } from "@/shared/lib/form";
import { deleteUpload, isExternalUrl, saveUpload } from "@/shared/lib/storage";
import { requireAdmin, requirePanel } from "@/features/auth/guards";
import { MIN_PASSWORD_LENGTH, hashPassword } from "@/features/auth/password";
import { parsePermissions } from "@/features/auth/permissions";
import { logActivity } from "@/features/audit/activity-log";
import { isPaymentMethod } from "@/features/reservations/constants";

const LIST_PATH = "/panel/personel";
const profilePath = (employeeId: string) => `${LIST_PATH}/${employeeId}`;
const EMPLOYEE_STATUSES = ["AKTIF", "AYRILDI"];

/* ---------------------------------------------------------------- */
/* Gunluk islemler - "Personel" yetkisi olan kullanicilar yapabilir. */
/* ---------------------------------------------------------------- */

export async function createEmployee(formData: FormData) {
  await requirePanel("personel");
  const fullName = str(formData, "fullName");
  const position = str(formData, "position");
  if (!fullName || !position) redirect(`${LIST_PATH}?hata=eksik`);

  await prisma.employee.create({
    data: {
      fullName,
      position,
      phone: optStr(formData, "phone"),
      salary: positiveNum(formData, "salary"),
      startDate: date(formData, "startDate") ?? new Date(),
    },
  });
  await logActivity("Personel ekledi", fullName);
  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=eklendi`);
}

export async function updateEmployeeStatus(formData: FormData) {
  await requirePanel("personel");
  const status = str(formData, "status");
  if (!EMPLOYEE_STATUSES.includes(status)) redirect(LIST_PATH);

  await prisma.employee.update({ where: { id: str(formData, "id") }, data: { status } });
  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}?ok=guncellendi`);
}

/** Maas odemesi: hem personelin gecmisinde hem genel muhasebe defterinde GIDER olarak gorunur. */
export async function paySalary(formData: FormData) {
  await requirePanel("personel");
  const employeeId = str(formData, "employeeId");
  const amount = positiveNum(formData, "amount");
  const accountId = str(formData, "accountId");
  const method = str(formData, "method");

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || !accountId || !amount || !isPaymentMethod(method)) redirect(`${LIST_PATH}?hata=odeme-eksik`);

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      category: "PERSONEL",
      title: `${employee.fullName} — maaş ödemesi`,
      amount,
      date: date(formData, "date") ?? new Date(),
      method,
      accountId,
      employeeId,
      note: optStr(formData, "note"),
    },
  });

  await logActivity("Maaş ödemesi girdi", `${employee.fullName} · ${fmtMoney(amount)}`);
  revalidatePath("/panel", "layout");
  redirect(`${LIST_PATH}?ok=odendi`);
}

/* ---------------------------------------------------------------- */
/* Ozluk dosyasi ve kullanici yonetimi - YALNIZCA tam admin.         */
/* Kimlik, saglik raporu gibi kisisel veriler icerir; ayrica sinirli */
/* yetkili bir kullanici kendine fazladan yetki tanimlayamamalidir.  */
/* ---------------------------------------------------------------- */

export async function updateEmployeeProfile(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const data = {
    fullName: str(formData, "fullName"),
    position: str(formData, "position"),
    phone: optStr(formData, "phone"),
    email: optStr(formData, "email"),
    idNumber: optStr(formData, "idNumber"),
    birthDate: date(formData, "birthDate"),
    address: optStr(formData, "address"),
    salary: positiveNum(formData, "salary"),
    note: optStr(formData, "note"),
  };
  if (!data.fullName || !data.position) redirect(`${profilePath(id)}?hata=eksik`);

  await prisma.employee.update({ where: { id }, data });
  redirect(`${profilePath(id)}?ok=1`);
}

/** Ozluk evraki yukleme. Dosyalar ozel yukleme klasorunde tutulur; yalnizca /api/ozluk
 *  uzerinden, admin girisi dogrulanarak okunur. */
export async function uploadEmployeeDocument(formData: FormData) {
  await requireAdmin();
  const employeeId = str(formData, "employeeId");
  const back = profilePath(employeeId);
  const title = str(formData, "title");
  const file = uploadedFile(formData, "file");
  const externalUrl = str(formData, "url");
  if (!title) redirect(`${back}?hata=evrak`);

  let stored: { filePath: string; fileName: string; mimeType: string };
  if (file) {
    const saved = await saveUpload("personel", file, employeeId);
    if (typeof saved === "string") redirect(`${back}?hata=${saved === "TOO_LARGE" ? "evrak-buyuk" : "evrak-tur"}`);
    stored = { filePath: saved.storedName, fileName: saved.originalName, mimeType: saved.mimeType };
  } else if (isExternalUrl(externalUrl)) {
    stored = { filePath: externalUrl, fileName: title, mimeType: "text/uri-list" };
  } else {
    redirect(`${back}?hata=evrak`);
  }

  await prisma.employeeDocument.create({ data: { employeeId, title, ...stored } });
  await logActivity("Özlük evrakı ekledi", title);
  redirect(`${back}?ok=evrak`);
}

export async function deleteEmployeeDocument(formData: FormData) {
  await requireAdmin();
  const doc = await prisma.employeeDocument.delete({ where: { id: str(formData, "id") } });
  if (!isExternalUrl(doc.filePath)) await deleteUpload("personel", doc.filePath);

  await logActivity("Özlük evrakı sildi", doc.title);
  redirect(`${profilePath(doc.employeeId)}?ok=evrak-silindi`);
}

function readPermissions(formData: FormData): string {
  return parsePermissions(strList(formData, "permissions").join(",")).join(",");
}

export async function createStaffUserForEmployee(formData: FormData) {
  await requireAdmin();
  const employeeId = str(formData, "employeeId");
  const back = profilePath(employeeId);
  const username = str(formData, "username").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = str(formData, "fullName");
  const permissions = readPermissions(formData);

  if (!username || !fullName || !permissions) redirect(`${back}?hata=kullanici-eksik`);
  if (password.length < MIN_PASSWORD_LENGTH) redirect(`${back}?hata=sifre-kisa`);

  const { salt, hash } = await hashPassword(password);
  try {
    await prisma.staffUser.create({
      data: { username, passwordSalt: salt, passwordHash: hash, fullName, permissions, employeeId },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    redirect(`${back}?hata=kullanici-cakisma`);
  }

  await logActivity("Personele sistem kullanıcısı açtı", `${fullName} (${username}) · yetkiler: ${permissions}`);
  redirect(`${back}?ok=kullanici-eklendi`);
}

export async function updateStaffUserPermissions(formData: FormData) {
  await requireAdmin();
  const permissions = readPermissions(formData);
  const user = await prisma.staffUser.update({ where: { id: str(formData, "id") }, data: { permissions } });

  await logActivity("Kullanıcı yetkilerini değiştirdi", `${user.username} · yeni yetkiler: ${permissions || "yok"}`);
  redirect(`${profilePath(str(formData, "employeeId"))}?ok=yetki-guncellendi`);
}

export async function resetStaffUserPassword(formData: FormData) {
  await requireAdmin();
  const back = profilePath(str(formData, "employeeId"));
  const password = String(formData.get("password") ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) redirect(`${back}?hata=sifre-kisa`);

  const { salt, hash } = await hashPassword(password);
  const user = await prisma.staffUser.update({ where: { id: str(formData, "id") }, data: { passwordSalt: salt, passwordHash: hash } });

  await logActivity("Kullanıcı şifresini sıfırladı", user.username);
  redirect(`${back}?ok=sifre-guncellendi`);
}

export async function toggleStaffUserActive(formData: FormData) {
  await requireAdmin();
  const isActive = checked(formData, "isActive");
  const user = await prisma.staffUser.update({ where: { id: str(formData, "id") }, data: { isActive } });

  await logActivity(isActive ? "Kullanıcıyı aktif etti" : "Kullanıcıyı pasif etti", user.username);
  redirect(`${profilePath(str(formData, "employeeId"))}?ok=1`);
}
