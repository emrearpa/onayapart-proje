"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { checked, optStr, positiveNum, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { SITE_SETTINGS_ID } from "@/features/content/defaults";
import { getSiteSettings } from "@/features/content/queries";
import { deleteTranslations, saveTranslationsFromForm } from "@/features/content/translations";

const PAGE_PATH = "/panel/menu";

function fail(reason: string): never {
  redirect(`${PAGE_PATH}?hata=${reason}`);
}

/** Menu hem panelde hem sitede (ana sayfa, /menu, ceviri sayfalari, misafir paneli) gorunur. */
function done(result: string): never {
  revalidatePath("/", "layout");
  redirect(`${PAGE_PATH}?ok=${result}`);
}

export async function createMenuCategory(formData: FormData) {
  await requirePanel("menu");
  const name = str(formData, "name");
  if (!name) fail("kategori-eksik");

  const category = await prisma.menuCategory.create({ data: { name, sort: (await prisma.menuCategory.count()) + 1 } });
  await saveTranslationsFromForm("MenuCategory", category.id, formData, ["name"]);
  await logActivity("Menü kategorisi ekledi", name);
  done("kategori-eklendi");
}

export async function deleteMenuCategory(formData: FormData) {
  await requirePanel("menu");
  const category = await prisma.menuCategory.delete({ where: { id: str(formData, "id") }, include: { items: { select: { id: true } } } });
  await Promise.all([
    deleteTranslations("MenuCategory", category.id),
    prisma.translation.deleteMany({ where: { modelName: "MenuItem", recordId: { in: category.items.map((i) => i.id) } } }),
  ]);
  await logActivity("Menü kategorisi sildi", category.name);
  done("silindi");
}

export async function createMenuItem(formData: FormData) {
  await requirePanel("menu");
  const categoryId = str(formData, "categoryId");
  const name = str(formData, "name");
  if (!name || !categoryId) fail("urun-eksik");

  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      description: optStr(formData, "description"),
      price: positiveNum(formData, "price"),
      sort: (await prisma.menuItem.count({ where: { categoryId } })) + 1,
    },
  });
  await saveTranslationsFromForm("MenuItem", item.id, formData, ["name", "description"]);
  await logActivity("Menü ürünü ekledi", name);
  done("urun-eklendi");
}

export async function updateMenuItem(formData: FormData) {
  await requirePanel("menu");
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!name) fail("urun-eksik");

  await prisma.menuItem.update({
    where: { id },
    data: {
      name,
      description: optStr(formData, "description"),
      price: positiveNum(formData, "price"),
      isAvailable: checked(formData, "isAvailable"),
      isDailySpecial: checked(formData, "isDailySpecial"),
    },
  });
  await saveTranslationsFromForm("MenuItem", id, formData, ["name", "description"]);
  done("guncellendi");
}

export async function deleteMenuItem(formData: FormData) {
  await requirePanel("menu");
  const item = await prisma.menuItem.delete({ where: { id: str(formData, "id") } });
  await deleteTranslations("MenuItem", item.id);
  await logActivity("Menü ürünü sildi", item.name);
  done("silindi");
}

/** Restoran/menu bolumunu sitede acar/kapatir - icerik silinmez, sadece gorunurluk degisir. */
export async function updateMenuVisibility(formData: FormData) {
  await requirePanel("menu");
  const menuEnabled = checked(formData, "menuEnabled");
  await getSiteSettings(); // ayar satiri henuz yoksa olusturur
  await prisma.siteSetting.update({ where: { id: SITE_SETTINGS_ID }, data: { menuEnabled } });

  await logActivity(menuEnabled ? "Restoran menüsünü siteye açtı" : "Restoran menüsünü siteden kapattı");
  done("gorunurluk");
}
