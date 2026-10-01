"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/db";
import { date, optStr, safeReturnPath, str, uploadedFile } from "@/shared/lib/form";
import { site } from "@/shared/lib/site";
import { escapeHtml } from "@/shared/lib/text";
import { deleteUpload, isExternalUrl, saveUpload } from "@/shared/lib/storage";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { getIntegrationSettings } from "@/features/integrations/settings";
import { sendEmail } from "@/features/messaging/email";
import { sendWhatsappMessage } from "@/features/messaging/whatsapp";

// Firma evraklari (vergi levhasi, ruhsat, sozlesme, police ...). Dosyalar ozel
// yukleme klasorunde durur ve yalnizca /api/evrak uzerinden, yetki kontroluyle acilir.

const PAGE_PATH = "/panel/evraklar";
type StoredFile ={ filePath: string; fileName: string; mimeType: string };

function fail(reason: string, back = PAGE_PATH): never {
  redirect(`${back}?hata=${reason}`);
}

const shareLink = (docId: string) => `${site.url}/api/evrak-paylasim/${docId}`;

export async function uploadCompanyDocument(formData: FormData) {
  await requirePanel("evraklar");
  const title = str(formData, "title");
  const file = uploadedFile(formData, "file");
  const externalUrl = str(formData, "url");
  if (!title) fail("evrak-eksik");

  let stored: StoredFile;
  if (file) {
    const saved = await saveUpload("firma", file);
    if (typeof saved === "string") fail(saved === "TOO_LARGE" ? "evrak-buyuk" : "evrak-tur");
    stored = { filePath: saved.storedName, fileName: saved.originalName, mimeType: saved.mimeType };
  } else if (isExternalUrl(externalUrl)) {
    // Sunucusuz barindirmada disk kalici olmadigi icin dosya yerine bulut deposu linki de kabul edilir.
    stored = { filePath: externalUrl, fileName: title, mimeType: "text/uri-list" };
  } else {
    fail("evrak-eksik");
  }

  await prisma.companyDocument.create({
    data: { title, category: optStr(formData, "category"), note: optStr(formData, "note"), expiresAt: date(formData, "expiresAt"), ...stored },
  });
  await logActivity("Firma evrakı ekledi", title);
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?ok=evrak-eklendi`);
}

export async function deleteCompanyDocument(formData: FormData) {
  await requirePanel("evraklar");
  const doc = await prisma.companyDocument.delete({ where: { id: str(formData, "id") } });
  if (!isExternalUrl(doc.filePath)) await deleteUpload("firma", doc.filePath);

  await logActivity("Firma evrakı sildi", doc.title);
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?ok=evrak-silindi`);
}

/** Bir firma evrakini WhatsApp'tan, disariya paylasilabilir bir link olarak gonderir. */
export async function sendCompanyDocumentWhatsapp(formData: FormData) {
  await requirePanel("evraklar");
  const back = safeReturnPath(str(formData, "back"), PAGE_PATH);
  const phone = str(formData, "phone");
  if (!phone) fail("telefon-eksik", back);

  const doc = await prisma.companyDocument.findUnique({ where: { id: str(formData, "docId") } });
  if (!doc) fail("evrak-bulunamadi", back);

  const body = `Merhaba, "${doc.title}" evrakını buradan görüntüleyebilirsiniz: ${shareLink(doc.id)}`;
  const result = await sendWhatsappMessage(phone, body);

  await prisma.messageLog.create({
    data: { phone, body, kind: "EVRAK", status: result.status, errorMessage: result.errorMessage ?? null },
  });
  await logActivity("Firma evrakını WhatsApp'tan gönderdi", `${doc.title} · ${phone}`);

  if (result.status === "LINK_HAZIRLANDI" && result.link) redirect(result.link);
  redirect(`${back}?ok=${result.status === "GONDERILDI" ? "wa-gonderildi" : "wa-hata"}`);
}

/** Bir firma evrakini e-posta ile, disariya paylasilabilir bir link olarak gonderir. */
export async function sendCompanyDocumentEmail(formData: FormData) {
  await requirePanel("evraklar");
  const to = str(formData, "email");
  if (!to) fail("eposta-eksik");

  const doc = await prisma.companyDocument.findUnique({ where: { id: str(formData, "docId") } });
  if (!doc) fail("evrak-bulunamadi");

  const link = shareLink(doc.id);
  const html = `<p>Merhaba,</p><p>"<b>${escapeHtml(doc.title)}</b>" evrakını aşağıdaki linkten görüntüleyebilirsiniz:</p><p><a href="${link}">${link}</a></p><p>${site.name}</p>`;
  const result = await sendEmail(await getIntegrationSettings(), to, `${doc.title} — ${site.name}`, html);

  await logActivity(
    result.ok ? "Firma evrakını e-posta ile gönderdi" : "Firma evrakı e-posta gönderimi başarısız oldu",
    `${doc.title} · ${to}`
  );
  redirect(result.ok ? `${PAGE_PATH}?ok=eposta-gonderildi` : `${PAGE_PATH}?hata=eposta-hata`);
}
