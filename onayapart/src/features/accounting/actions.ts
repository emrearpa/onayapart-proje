"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { fmtMoney } from "@/shared/lib/dates";
import { checked, date, num, optStr, positiveNum, safeReturnPath, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { INVENTORY_PURCHASE_CATEGORY, isValidCategory } from "@/features/accounting/constants";
import { updateIntegrationSettings } from "@/features/integrations/settings";
import { isPaymentMethod } from "@/features/reservations/constants";

const HOME_PATH = "/panel/muhasebe";
const ENTRY_PATH = `${HOME_PATH}/islem`;
const INVOICES_PATH = `${HOME_PATH}/faturalar`;

const revalidatePanel = () => revalidatePath("/panel", "layout");

export async function createAccount(formData: FormData) {
  await requirePanel("muhasebe");
  const name = str(formData, "name");
  if (!name) redirect(`${HOME_PATH}?hata=hesap-eksik`);

  await prisma.account.create({
    data: {
      name,
      type: str(formData, "type") === "BANKA" ? "BANKA" : "KASA",
      openingBalance: num(formData, "openingBalance"),
      sort: (await prisma.account.count()) + 1,
    },
  });
  await logActivity("Kasa/banka hesabı ekledi", name);
  revalidatePanel();
  redirect(`${HOME_PATH}?ok=hesap-eklendi`);
}

export async function createTransaction(formData: FormData) {
  await requirePanel("muhasebe");
  const type = str(formData, "type") === "GELIR" ? "GELIR" : "GIDER";
  const category = str(formData, "category");
  const title = str(formData, "title");
  const amount = positiveNum(formData, "amount");
  const method = str(formData, "method");
  const accountId = str(formData, "accountId");

  if (!title || !accountId || !amount || !isPaymentMethod(method) || !isValidCategory(type, category)) {
    redirect(`${ENTRY_PATH}?hata=kayit-eksik`);
  }

  // "Envanter / Stok Alimi" gideri secilirse hangi kalemden ne kadar alindigi da gelir;
  // gider kaydi ile stok girisi tek islemde yazilir (biri olup digeri olmasin diye).
  const itemId = str(formData, "inventoryItemId");
  const locationId = str(formData, "inventoryLocationId");
  const quantity = positiveNum(formData, "inventoryQuantity");
  const isStockPurchase = type === "GIDER" && category === INVENTORY_PURCHASE_CATEGORY && itemId && locationId && quantity > 0;

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        type,
        category,
        title,
        amount,
        date: date(formData, "date") ?? new Date(),
        method,
        accountId,
        employeeId: optStr(formData, "employeeId"),
        note: optStr(formData, "note"),
      },
    });
    if (!isStockPurchase) return;

    await tx.inventoryMovement.create({
      data: { itemId, type: "GIRIS", quantity, toLocationId: locationId, reason: `Muhasebe kaydı: ${title}`, transactionId: transaction.id },
    });
    await tx.inventoryStock.upsert({
      where: { itemId_locationId: { itemId, locationId } },
      update: { quantity: { increment: quantity } },
      create: { itemId, locationId, quantity },
    });
  });

  await logActivity(type === "GELIR" ? "Gelir kaydı ekledi" : "Gider kaydı ekledi", `${title} · ${fmtMoney(amount)}`);
  revalidatePanel();
  redirect(`${ENTRY_PATH}?ok=kayit-eklendi`);
}

export async function deleteTransaction(formData: FormData) {
  await requirePanel("muhasebe");
  const back = safeReturnPath(str(formData, "back"), ENTRY_PATH, HOME_PATH);

  const tx = await prisma.transaction.delete({ where: { id: str(formData, "id") } });
  await logActivity("Muhasebe kaydı sildi", `${tx.title} · ${fmtMoney(tx.amount)}`);
  revalidatePanel();
  redirect(`${back}?ok=silindi`);
}

/** iyzico online odeme ayarlari - firma diledigi an acip kapatabilir. */
export async function updateIyzicoSettings(formData: FormData) {
  await requirePanel("muhasebe");
  const iyzicoEnabled = checked(formData, "iyzicoEnabled");

  await updateIntegrationSettings(
    {
      iyzicoEnabled,
      iyzicoSandbox: checked(formData, "iyzicoSandbox"),
      iyzicoDefaultAccountId: optStr(formData, "iyzicoDefaultAccountId"),
    },
    { iyzicoApiKey: str(formData, "iyzicoApiKey"), iyzicoSecretKey: str(formData, "iyzicoSecretKey") }
  );

  await logActivity("Online ödeme ayarlarını değiştirdi", iyzicoEnabled ? "Etkinleştirildi" : "Devre dışı bırakıldı");
  revalidatePanel();
  revalidatePath("/musteri");
  redirect(`${HOME_PATH}?ok=odeme-ayar`);
}

/* ---------------------------------------------------------------- */
/* Fatura takibi - entegrator portalindan kesilen faturanin kaydi.   */
/* ---------------------------------------------------------------- */

/** Bir rezervasyon icin elle, belirli bir odemeye bagli olmadan yeni fatura talebi acar. */
export async function createManualInvoiceRequest(formData: FormData) {
  await requirePanel("muhasebe");
  const reservationId = str(formData, "reservationId");

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) redirect(`${INVOICES_PATH}?hata=bulunamadi`);

  const amount = positiveNum(formData, "amount") || reservation.totalAmount;
  await prisma.invoice.create({ data: { reservationId, amount, status: "BEKLIYOR", note: optStr(formData, "note") } });

  await logActivity("Fatura talebi açtı", `${reservation.code} · ${fmtMoney(amount)}`, reservationId);
  revalidatePath(INVOICES_PATH);
  redirect(`${INVOICES_PATH}?ok=talep-acildi`);
}

export async function markInvoiceIssued(formData: FormData) {
  await requirePanel("muhasebe");
  const invoiceNumber = str(formData, "invoiceNumber");
  if (!invoiceNumber) redirect(`${INVOICES_PATH}?hata=numara-eksik`);

  const invoice = await prisma.invoice.update({
    where: { id: str(formData, "invoiceId") },
    data: { status: "KESILDI", invoiceNumber, issuedAt: new Date() },
  });

  await logActivity("Fatura kesildi olarak işaretledi", invoiceNumber, invoice.reservationId);
  revalidatePath(INVOICES_PATH);
  redirect(`${INVOICES_PATH}?ok=kesildi`);
}

export async function markInvoicePending(formData: FormData) {
  await requirePanel("muhasebe");
  const invoice = await prisma.invoice.update({
    where: { id: str(formData, "invoiceId") },
    data: { status: "BEKLIYOR", invoiceNumber: null, issuedAt: null },
  });

  await logActivity("Faturayı beklemeye geri aldı", undefined, invoice.reservationId);
  revalidatePath(INVOICES_PATH);
  redirect(`${INVOICES_PATH}?ok=geri-alindi`);
}
