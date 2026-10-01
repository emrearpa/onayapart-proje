"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { logActivity } from "@/features/audit/activity-log";

function revalidateMenu() {
  revalidatePath("/panel/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function createMenuCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/panel/menu?hata=kategori-eksik");
  const count = await prisma.menuCategory.count();
  const cat = await prisma.menuCategory.create({ data: { name, sort: count + 1 } });

  const { saveTranslationsFromForm } = await import("@/features/content/translations");
  await saveTranslationsFromForm("MenuCategory", cat.id, formData, ["name"]);

  await logActivity("Menü kategorisi ekledi", name);
  revalidateMenu();
  redirect("/panel/menu?ok=kategori-eklendi");
}

export async function deleteMenuCategory(formData: FormData) {
  const id = String(formData.get("id"));
  const cat = await prisma.menuCategory.delete({ where: { id } });
  await logActivity("Menü kategorisi sildi", cat.name);
  revalidateMenu();
  redirect("/panel/menu?ok=silindi");
}

export async function createMenuItem(formData: FormData) {
  const categoryId = String(formData.get("categoryId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Number(formData.get("price") ?? 0);

  if (!name || !categoryId) redirect("/panel/menu?hata=urun-eksik");

  const count = await prisma.menuItem.count({ where: { categoryId } });
  const item = await prisma.menuItem.create({
    data: { categoryId, name, description, price: Number.isFinite(price) ? price : 0, sort: count + 1 },
  });

  const { saveTranslationsFromForm } = await import("@/features/content/translations");
  await saveTranslationsFromForm("MenuItem", item.id, formData, ["name", "description"]);

  await logActivity("Menü ürünü ekledi", name);
  revalidateMenu();
  redirect("/panel/menu?ok=urun-eklendi");
}

export async function updateMenuItem(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const price = Number(formData.get("price") ?? 0);
  const isAvailable = formData.get("isAvailable") === "on";
  const isDailySpecial = formData.get("isDailySpecial") === "on";

  if (!name) redirect("/panel/menu?hata=urun-eksik");

  await prisma.menuItem.update({
    where: { id },
    data: { name, description, price: Number.isFinite(price) ? price : 0, isAvailable, isDailySpecial },
  });

  const { saveTranslationsFromForm } = await import("@/features/content/translations");
  await saveTranslationsFromForm("MenuItem", id, formData, ["name", "description"]);

  revalidateMenu();
  redirect("/panel/menu?ok=guncellendi");
}

export async function deleteMenuItem(formData: FormData) {
  const id = String(formData.get("id"));
  const item = await prisma.menuItem.delete({ where: { id } });
  await logActivity("Menü ürünü sildi", item.name);
  revalidateMenu();
  redirect("/panel/menu?ok=silindi");
}

/** Restoran/menu bolumunu sitede acar/kapatir - icerik silinmez, sadece gorunurluk degisir. */
export async function updateMenuVisibility(formData: FormData) {
  const menuEnabled = formData.get("menuEnabled") === "on";
  await prisma.siteSetting.update({ where: { id: "main" }, data: { menuEnabled } });
  await logActivity(menuEnabled ? "Restoran menüsünü siteye açtı" : "Restoran menüsünü siteden kapattı");
  revalidateMenu();
  redirect("/panel/menu?ok=gorunurluk");
}
