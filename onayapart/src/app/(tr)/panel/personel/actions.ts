"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/staffAuth";
import { logActivity } from "@/lib/activityLog";
import { fmtMoney } from "@/lib/dates";

export async function createEmployee(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const salary = Number(formData.get("salary") ?? 0);
  const startDateRaw = String(formData.get("startDate") ?? "").trim();

  if (!fullName || !position) redirect("/panel/personel?hata=eksik");

  await prisma.employee.create({
    data: {
      fullName,
      position,
      phone,
      salary: Number.isFinite(salary) ? salary : 0,
      startDate: startDateRaw ? new Date(startDateRaw) : new Date(),
    },
  });

  redirect("/panel/personel?ok=eklendi");
}

export async function updateEmployeeStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status") ?? "AKTIF");
  await prisma.employee.update({ where: { id }, data: { status } });
  redirect("/panel/personel?ok=guncellendi");
}

/** Personele maas odemesi: hem Employee gecmisinde hem genel muhasebe defterinde GIDER olarak gorunur. */
export async function paySalary(formData: FormData) {
  const employeeId = String(formData.get("employeeId"));
  const amount = Number(formData.get("amount") ?? 0);
  const accountId = String(formData.get("accountId") ?? "");
  const method = String(formData.get("method") ?? "HAVALE");
  const dateRaw = String(formData.get("date") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || !accountId || !amount || amount <= 0) {
    redirect("/panel/personel?hata=odeme-eksik");
  }

  await prisma.transaction.create({
    data: {
      type: "GIDER",
      category: "PERSONEL",
      title: `${employee!.fullName} — maaş ödemesi`,
      amount,
      date: dateRaw ? new Date(dateRaw) : new Date(),
      method,
      accountId,
      employeeId,
      note,
    },
  });

  await logActivity("Maaş ödemesi girdi", `${employee!.fullName} · ${fmtMoney(amount)}`);

  revalidatePath("/panel/muhasebe");
  revalidatePath("/panel");
  redirect("/panel/personel?ok=odendi");
}

/* ---------------------------------------------------------------- */
/* Ozluk dosyasi: kisisel bilgiler ve taranan evraklar.               */
/* ---------------------------------------------------------------- */

export async function updateEmployeeProfile(formData: FormData) {
  const id = String(formData.get("id"));
  const data = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    position: String(formData.get("position") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    idNumber: String(formData.get("idNumber") ?? "").trim() || null,
    birthDate: (() => {
      const v = String(formData.get("birthDate") ?? "").trim();
      return v ? new Date(v) : null;
    })(),
    address: String(formData.get("address") ?? "").trim() || null,
    salary: Number(formData.get("salary") ?? 0),
    note: String(formData.get("note") ?? "").trim() || null,
  };

  if (!data.fullName || !data.position) redirect(`/panel/personel/${id}?hata=eksik`);

  await prisma.employee.update({ where: { id }, data });
  redirect(`/panel/personel/${id}?ok=1`);
}

/** Ozluk evraki yukleme. Dosyalar public/ disinda "private-uploads" klasorunde tutulur,
 *  boylece dogrudan bir URL ile web'den erisilemez - sadece /api/ozluk uzerinden, admin
 *  girisi dogrulanarak okunur. */
export async function uploadEmployeeDocument(formData: FormData) {
  const employeeId = String(formData.get("employeeId"));
  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file") as File | null;
  const externalUrl = String(formData.get("url") ?? "").trim();

  if (!title) redirect(`/panel/personel/${employeeId}?hata=evrak`);

  let filePath: string;
  let fileName: string;
  let mimeType: string;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
    const filename = `${employeeId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const dir = path.join(process.cwd(), "private-uploads", "personel");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
    filePath = filename;
    fileName = file.name;
    mimeType = file.type || "application/octet-stream";
  } else if (externalUrl) {
    // Sunucusuz barindirmada (orn. Vercel) diske yazma kalici olmadigi icin, dosya yerine
    // bir bulut deposu linki (Google Drive, Dropbox vb.) de kabul edilir.
    filePath = externalUrl;
    fileName = title;
    mimeType = "text/uri-list";
  } else {
    redirect(`/panel/personel/${employeeId}?hata=evrak`);
  }

  await prisma.employeeDocument.create({
    data: { employeeId, title, filePath, fileName, mimeType },
  });

  redirect(`/panel/personel/${employeeId}?ok=evrak`);
}

export async function deleteEmployeeDocument(formData: FormData) {
  const id = String(formData.get("id"));
  const employeeId = String(formData.get("employeeId"));
  const doc = await prisma.employeeDocument.findUnique({ where: { id } });

  await prisma.employeeDocument.delete({ where: { id } });

  if (doc) {
    try {
      await unlink(path.join(process.cwd(), "private-uploads", "personel", doc.filePath));
    } catch {
      // dosya zaten yoksa yoksay
    }
  }

  redirect(`/panel/personel/${employeeId}?ok=evrak-silindi`);
}

/* ---------------------------------------------------------------- */
/* Personel icin sinirli yetkili sistem kullanicisi olusturma.       */
/* ---------------------------------------------------------------- */

export async function createStaffUserForEmployee(formData: FormData) {
  const employeeId = String(formData.get("employeeId"));
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const permissions = (formData.getAll("permissions") as string[]).join(",");

  if (!username || password.length < 4 || !fullName || permissions.length === 0) {
    redirect(`/panel/personel/${employeeId}?hata=kullanici-eksik`);
  }

  const { salt, hash } = await hashPassword(password);

  try {
    await prisma.staffUser.create({
      data: {
        username,
        passwordSalt: salt,
        passwordHash: hash,
        fullName,
        permissions,
        employeeId,
      },
    });
  } catch {
    redirect(`/panel/personel/${employeeId}?hata=kullanici-cakisma`);
  }

  await logActivity("Personele sistem kullanıcısı açtı", `${fullName} (${username}) · yetkiler: ${permissions}`);

  redirect(`/panel/personel/${employeeId}?ok=kullanici-eklendi`);
}

export async function updateStaffUserPermissions(formData: FormData) {
  const id = String(formData.get("id"));
  const employeeId = String(formData.get("employeeId"));
  const permissions = (formData.getAll("permissions") as string[]).join(",");
  const user = await prisma.staffUser.update({ where: { id }, data: { permissions } });
  await logActivity("Kullanıcı yetkilerini değiştirdi", `${user.username} · yeni yetkiler: ${permissions || "yok"}`);
  redirect(`/panel/personel/${employeeId}?ok=yetki-guncellendi`);
}

export async function resetStaffUserPassword(formData: FormData) {
  const id = String(formData.get("id"));
  const employeeId = String(formData.get("employeeId"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 4) redirect(`/panel/personel/${employeeId}?hata=sifre-kisa`);

  const { salt, hash } = await hashPassword(password);
  const user = await prisma.staffUser.update({ where: { id }, data: { passwordSalt: salt, passwordHash: hash } });
  await logActivity("Kullanıcı şifresini sıfırladı", user.username);
  redirect(`/panel/personel/${employeeId}?ok=sifre-guncellendi`);
}

export async function toggleStaffUserActive(formData: FormData) {
  const id = String(formData.get("id"));
  const employeeId = String(formData.get("employeeId"));
  const isActive = formData.get("isActive") === "true";
  const user = await prisma.staffUser.update({ where: { id }, data: { isActive } });
  await logActivity(isActive ? "Kullanıcıyı aktif etti" : "Kullanıcıyı pasif etti", user.username);
  redirect(`/panel/personel/${employeeId}?ok=1`);
}
