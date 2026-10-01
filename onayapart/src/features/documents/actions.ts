"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/shared/lib/db";
import { logActivity } from "@/features/audit/activity-log";
import { site } from "@/shared/lib/site";

export async function uploadCompanyDocument(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const expiresAtRaw = String(formData.get("expiresAt") ?? "").trim();
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  const file = formData.get("file") as File | null;
  const externalUrl = String(formData.get("url") ?? "").trim();

  if (!title) redirect("/panel/evraklar?hata=evrak-eksik");

  let filePath: string;
  let fileName: string;
  let mimeType: string;

  if (file && file.size > 0) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split(".").pop() || "pdf").toLowerCase().replace(/[^a-z0-9]/g, "") || "pdf";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const dir = path.join(process.cwd(), "private-uploads", "firma");
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
    redirect("/panel/evraklar?hata=evrak-eksik");
  }

  await prisma.companyDocument.create({
    data: { title, category, note, expiresAt, filePath, fileName, mimeType },
  });

  await logActivity("Firma evrakı ekledi", title);
  revalidatePath("/panel/evraklar");
  redirect("/panel/evraklar?ok=evrak-eklendi");
}

export async function deleteCompanyDocument(formData: FormData) {
  const id = String(formData.get("id"));
  const doc = await prisma.companyDocument.findUnique({ where: { id } });

  await prisma.companyDocument.delete({ where: { id } });

  if (doc && !doc.filePath.startsWith("http")) {
    try {
      await unlink(path.join(process.cwd(), "private-uploads", "firma", doc.filePath));
    } catch {
      // dosya zaten yoksa yoksay
    }
  }

  await logActivity("Firma evrakı sildi", doc?.title ?? "");
  revalidatePath("/panel/evraklar");
  redirect("/panel/evraklar?ok=evrak-silindi");
}

/** Bir firma evrakini WhatsApp'tan, disariya paylasilabilir bir link olarak gonderir. */
export async function sendCompanyDocumentWhatsapp(formData: FormData) {
  const docId = String(formData.get("docId"));
  const phone = String(formData.get("phone") ?? "").trim();
  const back = String(formData.get("back") ?? "/panel/evraklar");

  if (!phone) redirect(`${back}?hata=telefon-eksik`);

  const doc = await prisma.companyDocument.findUnique({ where: { id: docId } });
  if (!doc) redirect(`${back}?hata=evrak-bulunamadi`);

  const link = `${site.url}/api/evrak-paylasim/${docId}`;
  const body = `Merhaba, "${doc!.title}" evrakını buradan görüntüleyebilirsiniz: ${link}`;

  const { sendWhatsappMessage } = await import("@/lib/whatsapp");
  const result = await sendWhatsappMessage(phone, body);

  await prisma.messageLog.create({
    data: { phone, body, kind: "EVRAK", status: result.status, errorMessage: result.errorMessage ?? null },
  });

  await logActivity("Firma evrakını WhatsApp'tan gönderdi", `${doc!.title} · ${phone}`);
  revalidatePath("/panel/evraklar");

  if (result.status === "LINK_HAZIRLANDI" && result.link) {
    redirect(result.link);
  }
  redirect(`${back}?ok=${result.status === "GONDERILDI" ? "wa-gonderildi" : "wa-hata"}`);
}

/** Bir firma evrakini e-posta ile, disariya paylasilabilir bir link olarak gonderir. */
export async function sendCompanyDocumentEmail(formData: FormData) {
  const docId = String(formData.get("docId"));
  const to = String(formData.get("email") ?? "").trim();

  if (!to) redirect("/panel/evraklar?hata=eposta-eksik");

  const doc = await prisma.companyDocument.findUnique({ where: { id: docId } });
  if (!doc) redirect("/panel/evraklar?hata=evrak-bulunamadi");

  const settings = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  const link = `${site.url}/api/evrak-paylasim/${docId}`;
  const html = `<p>Merhaba,</p><p>"<b>${doc!.title}</b>" evrakını aşağıdaki linkten görüntüleyebilirsiniz:</p><p><a href="${link}">${link}</a></p><p>Onay Apart Rezidans</p>`;

  const { sendEmail } = await import("@/features/messaging/email");
  const result = await sendEmail(
    {
      emailEnabled: settings?.emailEnabled ?? false,
      emailApiKey: settings?.emailApiKey ?? "",
      emailFrom: settings?.emailFrom ?? "",
    },
    to,
    `${doc!.title} — Onay Apart Rezidans`,
    html
  );

  await logActivity(
    result.ok ? "Firma evrakını e-posta ile gönderdi" : "Firma evrakı e-posta gönderimi başarısız oldu",
    `${doc!.title} · ${to}`
  );
  revalidatePath("/panel/evraklar");

  if (!result.ok) {
    redirect(`/panel/evraklar?hata=eposta-hata`);
  }
  redirect("/panel/evraklar?ok=eposta-gonderildi");
}
