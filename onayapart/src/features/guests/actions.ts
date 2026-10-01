"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { date, optStr, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";

/** Misafirin kimlik, iletisim ve WiFi bilgilerini gunceller. */
export async function updateGuest(formData: FormData) {
  await requirePanel("musteriler");
  const id = str(formData, "id");
  const back = `/panel/musteriler/${id}`;

  const data = {
    fullName: str(formData, "fullName"),
    phone: str(formData, "phone"),
    email: optStr(formData, "email"),
    idType: str(formData, "idType") === "PASAPORT" ? "PASAPORT" : "TC",
    idNumber: optStr(formData, "idNumber"),
    birthDate: date(formData, "birthDate"),
    nationality: str(formData, "nationality") || "TR",
    address: optStr(formData, "address"),
    wifiNetwork: optStr(formData, "wifiNetwork"),
    wifiPassword: optStr(formData, "wifiPassword"),
    note: optStr(formData, "note"),
  };
  if (!data.fullName || !data.phone) redirect(`${back}?hata=eksik`);

  await prisma.guest.update({ where: { id }, data });
  await logActivity("Müşteri bilgilerini güncelledi", data.fullName);
  revalidatePath("/panel", "layout");
  redirect(`${back}?ok=1`);
}
