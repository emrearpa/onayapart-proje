"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { logActivity } from "@/features/audit/activity-log";

export async function createInventoryItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "DIGER");
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const minQuantity = Number(formData.get("minQuantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) redirect("/panel/envanter?hata=eksik");

  await prisma.inventoryItem.create({
    data: { name, category, unit, minQuantity: Number.isFinite(minQuantity) ? minQuantity : 0, note },
  });

  await logActivity("Stok kalemi ekledi", name);
  revalidatePath("/panel/envanter");
  revalidatePath("/panel");
  redirect("/panel/envanter?ok=eklendi");
}

export async function updateInventoryItem(formData: FormData) {
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "DIGER");
  const unit = String(formData.get("unit") ?? "adet").trim() || "adet";
  const minQuantity = Number(formData.get("minQuantity") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!name) redirect("/panel/envanter?hata=eksik");

  await prisma.inventoryItem.update({
    where: { id },
    data: { name, category, unit, minQuantity: Number.isFinite(minQuantity) ? minQuantity : 0, note },
  });

  revalidatePath("/panel/envanter");
  redirect("/panel/envanter?ok=guncellendi");
}

export async function deleteInventoryItem(formData: FormData) {
  const id = String(formData.get("id"));
  const item = await prisma.inventoryItem.delete({ where: { id } });
  await logActivity("Stok kalemi sildi", item.name);
  revalidatePath("/panel/envanter");
  revalidatePath("/panel");
  redirect("/panel/envanter?ok=silindi");
}

export async function createLocation(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "DIGER");
  if (!name) redirect("/panel/envanter?hata=konum-eksik");

  try {
    await prisma.inventoryLocation.create({ data: { name, type } });
  } catch {
    redirect("/panel/envanter?hata=konum-cakisma");
  }
  revalidatePath("/panel/envanter");
  redirect("/panel/envanter?ok=konum-eklendi");
}

/** Depoya (veya secilen konuma) satin alim/giris kaydi. */
export async function recordStockIn(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const locationId = String(formData.get("locationId"));
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!itemId || !locationId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect("/panel/envanter?hata=hareket-eksik");
  }

  await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { itemId, type: "GIRIS", quantity, reason, toLocationId: locationId },
    }),
    prisma.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { itemId, locationId, quantity },
    }),
  ]);

  revalidatePath("/panel/envanter");
  redirect("/panel/envanter?ok=hareket");
}

/** Bir konumdan digerine stok aktarimi (orn. Depo -> Kat Hizmetleri). */
export async function transferStock(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const fromLocationId = String(formData.get("fromLocationId"));
  const toLocationId = String(formData.get("toLocationId"));
  const quantity = Number(formData.get("quantity") ?? 0);

  if (!itemId || !fromLocationId || !toLocationId || fromLocationId === toLocationId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect("/panel/envanter?hata=hareket-eksik");
  }

  const fromStock = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId: fromLocationId } },
  });
  if (!fromStock || fromStock.quantity < quantity) {
    redirect("/panel/envanter?hata=stok-yetersiz");
  }

  await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { itemId, type: "TRANSFER", quantity, fromLocationId, toLocationId },
    }),
    prisma.inventoryStock.update({
      where: { itemId_locationId: { itemId, locationId: fromLocationId } },
      data: { quantity: { decrement: quantity } },
    }),
    prisma.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId: toLocationId } },
      update: { quantity: { increment: quantity } },
      create: { itemId, locationId: toLocationId, quantity },
    }),
  ]);

  revalidatePath("/panel/envanter");
  redirect("/panel/envanter?ok=hareket");
}

/** Tuketim / cikis - genelde kat hizmetlerindeki stoktan malzeme kullanildiginda. */
export async function recordStockOut(formData: FormData) {
  const itemId = String(formData.get("itemId"));
  const fromLocationId = String(formData.get("fromLocationId"));
  const quantity = Number(formData.get("quantity") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const roomId = String(formData.get("roomId") ?? "") || null;

  if (!itemId || !fromLocationId || !Number.isFinite(quantity) || quantity <= 0) {
    redirect("/panel/envanter?hata=hareket-eksik");
  }

  const fromStock = await prisma.inventoryStock.findUnique({
    where: { itemId_locationId: { itemId, locationId: fromLocationId } },
  });
  if (!fromStock || fromStock.quantity < quantity) {
    redirect("/panel/envanter?hata=stok-yetersiz");
  }

  await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { itemId, type: "CIKIS", quantity, reason, roomId, fromLocationId },
    }),
    prisma.inventoryStock.update({
      where: { itemId_locationId: { itemId, locationId: fromLocationId } },
      data: { quantity: { decrement: quantity } },
    }),
  ]);

  revalidatePath("/panel/envanter");
  redirect("/panel/envanter?ok=hareket");
}
