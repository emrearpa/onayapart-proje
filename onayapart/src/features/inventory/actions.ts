"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isUniqueViolation, prisma } from "@/shared/lib/db";
import { optStr, positiveNum, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";

// Stok dogrudan degistirilmez; her degisiklik bir hareket (GIRIS / TRANSFER / CIKIS)
// olarak kaydedilir ve konum bazli miktar ayni islemde guncellenir.

const PAGE_PATH = "/panel/envanter";

function fail(reason: string): never {
  redirect(`${PAGE_PATH}?hata=${reason}`);
}

function done(result: string): never {
  revalidatePath("/panel", "layout");
  redirect(`${PAGE_PATH}?ok=${result}`);
}

function readItemFields(formData: FormData) {
  return {
    name: str(formData, "name"),
    category: str(formData, "category") || "DIGER",
    unit: str(formData, "unit") || "adet",
    minQuantity: positiveNum(formData, "minQuantity"),
    note: optStr(formData, "note"),
  };
}

export async function createInventoryItem(formData: FormData) {
  await requirePanel("envanter");
  const data = readItemFields(formData);
  if (!data.name) fail("eksik");

  await prisma.inventoryItem.create({ data });
  await logActivity("Stok kalemi ekledi", data.name);
  done("eklendi");
}

export async function updateInventoryItem(formData: FormData) {
  await requirePanel("envanter");
  const data = readItemFields(formData);
  if (!data.name) fail("eksik");

  await prisma.inventoryItem.update({ where: { id: str(formData, "id") }, data });
  done("guncellendi");
}

export async function deleteInventoryItem(formData: FormData) {
  await requirePanel("envanter");
  const item = await prisma.inventoryItem.delete({ where: { id: str(formData, "id") } });
  await logActivity("Stok kalemi sildi", item.name);
  done("silindi");
}

export async function createLocation(formData: FormData) {
  await requirePanel("envanter");
  const name = str(formData, "name");
  if (!name) fail("konum-eksik");

  try {
    const count = await prisma.inventoryLocation.count();
    await prisma.inventoryLocation.create({ data: { name, type: str(formData, "type") || "DEPO", sort: count + 1 } });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    fail("konum-cakisma");
  }
  done("konum-eklendi");
}

/** Depoya (veya secilen konuma) satin alim/giris kaydi. */
export async function recordStockIn(formData: FormData) {
  await requirePanel("envanter");
  const itemId = str(formData, "itemId");
  const locationId = str(formData, "locationId");
  const quantity = positiveNum(formData, "quantity");
  if (!itemId || !locationId || !quantity) fail("hareket-eksik");

  await prisma.$transaction([
    prisma.inventoryMovement.create({ data: { itemId, type: "GIRIS", quantity, reason: optStr(formData, "reason"), toLocationId: locationId } }),
    prisma.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { itemId, locationId, quantity },
    }),
  ]);
  done("hareket");
}

/**
 * Kaynak konumdan stok duser. Yeterli stok kosulu guncelleme sorgusunun icindedir;
 * ayni anda iki cikis yapilsa bile miktar eksiye dusmez. Stok yetmezse false doner.
 */
async function withdrawStock(
  itemId: string,
  fromLocationId: string,
  quantity: number,
  movement: { type: "TRANSFER" | "CIKIS"; toLocationId?: string; reason?: string | null; roomId?: string | null }
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.inventoryStock.updateMany({
      where: { itemId, locationId: fromLocationId, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    });
    if (count === 0) return false;

    await tx.inventoryMovement.create({ data: { itemId, quantity, fromLocationId, ...movement } });
    if (movement.toLocationId) {
      await tx.inventoryStock.upsert({
        where: { itemId_locationId: { itemId, locationId: movement.toLocationId } },
        update: { quantity: { increment: quantity } },
        create: { itemId, locationId: movement.toLocationId, quantity },
      });
    }
    return true;
  });
}

/** Bir konumdan digerine stok aktarimi (orn. Depo -> Kat Hizmetleri). */
export async function transferStock(formData: FormData) {
  await requirePanel("envanter");
  const itemId = str(formData, "itemId");
  const fromLocationId = str(formData, "fromLocationId");
  const toLocationId = str(formData, "toLocationId");
  const quantity = positiveNum(formData, "quantity");
  if (!itemId || !fromLocationId || !toLocationId || fromLocationId === toLocationId || !quantity) fail("hareket-eksik");

  if (!(await withdrawStock(itemId, fromLocationId, quantity, { type: "TRANSFER", toLocationId }))) fail("stok-yetersiz");
  done("hareket");
}

/** Tuketim / cikis - genelde kat hizmetlerindeki stoktan malzeme kullanildiginda. */
export async function recordStockOut(formData: FormData) {
  await requirePanel("envanter");
  const itemId = str(formData, "itemId");
  const fromLocationId = str(formData, "fromLocationId");
  const quantity = positiveNum(formData, "quantity");
  if (!itemId || !fromLocationId || !quantity) fail("hareket-eksik");

  const movement = { type: "CIKIS" as const, reason: optStr(formData, "reason"), roomId: optStr(formData, "roomId") };
  if (!(await withdrawStock(itemId, fromLocationId, quantity, movement))) fail("stok-yetersiz");
  done("hareket");
}
