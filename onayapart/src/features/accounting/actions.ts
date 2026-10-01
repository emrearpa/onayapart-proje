"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { logActivity } from "@/features/audit/activity-log";
import { fmtMoney } from "@/shared/lib/dates";

export async function createAccount(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "KASA");
  const openingBalance = Number(formData.get("openingBalance") ?? 0);

  if (!name) redirect("/panel/muhasebe?hata=hesap-eksik");

  const count = await prisma.account.count();
  await prisma.account.create({
    data: { name, type, openingBalance: Number.isFinite(openingBalance) ? openingBalance : 0, sort: count + 1 },
  });

  revalidatePath("/panel/muhasebe");
  redirect("/panel/muhasebe?ok=hesap-eklendi");
}

export async function createTransaction(formData: FormData) {
  const type = String(formData.get("type") ?? "GIDER");
  const category = String(formData.get("category") ?? "DIGER");
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dateRaw = String(formData.get("date") ?? "").trim();
  const method = String(formData.get("method") ?? "NAKIT");
  const accountId = String(formData.get("accountId") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "") || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  // "Envanter / Stok Alımı" gideri secilirse hangi kalemden ne kadar al indigi de gelir.
  const inventoryItemId = String(formData.get("inventoryItemId") ?? "") || null;
  const inventoryLocationId = String(formData.get("inventoryLocationId") ?? "") || null;
  const inventoryQuantity = Number(formData.get("inventoryQuantity") ?? 0);

  if (!title || !accountId || !amount || amount <= 0) {
    redirect("/panel/muhasebe/islem?hata=kayit-eksik");
  }

  const transaction = await prisma.transaction.create({
    data: {
      type,
      category,
      title,
      amount,
      date: dateRaw ? new Date(dateRaw) : new Date(),
      method,
      accountId,
      employeeId,
      note,
    },
  });

  // Bu bir envanter alimiysa, stok girisini otomatik olarak isle (depoya ekle).
  if (
    type === "GIDER" &&
    category === "MALZEME" &&
    inventoryItemId &&
    inventoryLocationId &&
    Number.isFinite(inventoryQuantity) &&
    inventoryQuantity > 0
  ) {
    await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          itemId: inventoryItemId,
          type: "GIRIS",
          quantity: inventoryQuantity,
          toLocationId: inventoryLocationId,
          reason: `Muhasebe kaydı: ${title}`,
          transactionId: transaction.id,
        },
      }),
      prisma.inventoryStock.upsert({
        where: { itemId_locationId: { itemId: inventoryItemId, locationId: inventoryLocationId } },
        update: { quantity: { increment: inventoryQuantity } },
        create: { itemId: inventoryItemId, locationId: inventoryLocationId, quantity: inventoryQuantity },
      }),
    ]);
  }

  await logActivity(type === "GELIR" ? "Gelir kaydı ekledi" : "Gider kaydı ekledi", `${title} · ${fmtMoney(amount)}`);

  revalidatePath("/panel/muhasebe");
  revalidatePath("/panel/muhasebe/islem");
  revalidatePath("/panel/muhasebe/rapor");
  revalidatePath("/panel/muhasebe/kasa");
  revalidatePath("/panel/muhasebe/banka");
  revalidatePath("/panel/muhasebe/pos");
  revalidatePath("/panel/envanter");
  revalidatePath("/panel");
  redirect("/panel/muhasebe/islem?ok=kayit-eklendi");
}

export async function deleteTransaction(formData: FormData) {
  const id = String(formData.get("id"));
  const back = String(formData.get("back") ?? "/panel/muhasebe/islem");
  const tx = await prisma.transaction.delete({ where: { id } });
  await logActivity("Muhasebe kaydı sildi", `${tx.title} · ${fmtMoney(tx.amount)}`);
  revalidatePath("/panel/muhasebe");
  revalidatePath("/panel/muhasebe/islem");
  revalidatePath("/panel/muhasebe/rapor");
  revalidatePath("/panel");
  redirect(`${back}?ok=silindi`);
}

/* ---------------------------------------------------------------- */
/* iyzico online odeme ayarlari - firma diledigi an acip kapatabilir. */
/* ---------------------------------------------------------------- */

export async function updateIyzicoSettings(formData: FormData) {
  const iyzicoEnabled = formData.get("iyzicoEnabled") === "on";
  const iyzicoSandbox = formData.get("iyzicoSandbox") === "on";
  const iyzicoApiKey = String(formData.get("iyzicoApiKey") ?? "").trim();
  const iyzicoSecretKey = String(formData.get("iyzicoSecretKey") ?? "").trim();
  const iyzicoDefaultAccountId = String(formData.get("iyzicoDefaultAccountId") ?? "").trim() || null;

  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });

  await prisma.integrationSetting.upsert({
    where: { id: "main" },
    update: {
      iyzicoEnabled,
      iyzicoSandbox,
      iyzicoDefaultAccountId,
      // Anahtar alanlari bos birakilirsa mevcut deger korunur (her kaydetmede yeniden yapistirmak gerekmesin).
      iyzicoApiKey: iyzicoApiKey || existing?.iyzicoApiKey || "",
      iyzicoSecretKey: iyzicoSecretKey || existing?.iyzicoSecretKey || "",
    },
    create: { id: "main", iyzicoEnabled, iyzicoSandbox, iyzicoApiKey, iyzicoSecretKey, iyzicoDefaultAccountId },
  });

  await logActivity("Online ödeme ayarlarını değiştirdi", iyzicoEnabled ? "Etkinleştirildi" : "Devre dışı bırakıldı");

  revalidatePath("/panel/muhasebe");
  revalidatePath("/musteri");
  redirect("/panel/muhasebe?ok=odeme-ayar");
}

/* ---------------------------------------------------------------- */
/* Fatura takibi - Uyumsoft portalinden kesilen faturanin kaydi.      */
/* Otomatik SOAP baglantisi icin WSDL bekleniyor, simdilik manuel.    */
/* ---------------------------------------------------------------- */

/** Bir rezervasyon icin elle, belirli bir odemeye bagli olmadan yeni fatura talebi acar. */
export async function createManualInvoiceRequest(formData: FormData) {
  const reservationId = String(formData.get("reservationId"));
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) redirect("/panel/muhasebe/faturalar?hata=bulunamadi");

  const amount = amountRaw ? Number(amountRaw) : reservation!.totalAmount;

  await prisma.invoice.create({
    data: { reservationId, amount, status: "BEKLIYOR", note },
  });

  await logActivity("Fatura talebi açtı", `${reservation!.code} · ${fmtMoney(amount)}`, reservationId);
  revalidatePath("/panel/muhasebe/faturalar");
  redirect("/panel/muhasebe/faturalar?ok=talep-acildi");
}

export async function markInvoiceIssued(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId"));
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();

  if (!invoiceNumber) redirect("/panel/muhasebe/faturalar?hata=numara-eksik");

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "KESILDI", invoiceNumber, issuedAt: new Date() },
  });

  await logActivity("Fatura kesildi olarak işaretledi", invoiceNumber, updated.reservationId);
  revalidatePath("/panel/muhasebe/faturalar");
  redirect("/panel/muhasebe/faturalar?ok=kesildi");
}

export async function markInvoicePending(formData: FormData) {
  const invoiceId = String(formData.get("invoiceId"));
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "BEKLIYOR", invoiceNumber: null, issuedAt: null },
  });
  revalidatePath("/panel/muhasebe/faturalar");
  redirect("/panel/muhasebe/faturalar?ok=geri-alindi");
}
