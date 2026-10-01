"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { computeMonthlyStats, sendTgaReport } from "@/lib/tga";

export async function updateTgaSettings(formData: FormData) {
  const tgaEnabled = formData.get("tgaEnabled") === "on";
  const tgaSandbox = formData.get("tgaSandbox") === "on";
  const tgaApiKey = String(formData.get("tgaApiKey") ?? "").trim();
  const tgaIlKodu = String(formData.get("tgaIlKodu") ?? "25").trim();
  const tgaIlceKodu = String(formData.get("tgaIlceKodu") ?? "2045").trim();
  const tgaOdaSayisi = Number(formData.get("tgaOdaSayisi") ?? 0);
  const tgaYatakSayisi = Number(formData.get("tgaYatakSayisi") ?? 0);

  const existing = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  // Tesis kimligi bir kere uretilir, hep ayni kalmali (TGA'ya "ayni tesis" olarak taninmasi icin).
  const tgaFacilityId = existing?.tgaFacilityId || randomUUID();

  await prisma.integrationSetting.upsert({
    where: { id: "main" },
    update: {
      tgaEnabled,
      tgaSandbox,
      tgaIlKodu,
      tgaIlceKodu,
      tgaOdaSayisi: Number.isFinite(tgaOdaSayisi) ? tgaOdaSayisi : 0,
      tgaYatakSayisi: Number.isFinite(tgaYatakSayisi) ? tgaYatakSayisi : 0,
      tgaFacilityId,
      tgaApiKey: tgaApiKey || existing?.tgaApiKey || "",
    },
    create: {
      id: "main",
      tgaEnabled,
      tgaSandbox,
      tgaIlKodu,
      tgaIlceKodu,
      tgaOdaSayisi,
      tgaYatakSayisi,
      tgaFacilityId,
      tgaApiKey,
    },
  });

  await logActivity("TGA ayarlarını güncelledi", tgaEnabled ? "Etkinleştirildi" : "Devre dışı bırakıldı");
  revalidatePath("/panel/muhasebe/tga");
  redirect("/panel/muhasebe/tga?ok=ayar");
}

export async function sendTgaReportAction(formData: FormData) {
  const reportMonth = String(formData.get("reportMonth") ?? "").trim();
  const priceRaw = String(formData.get("aylikOrtalamaFiyat") ?? "").trim();
  const aylikOrtalamaFiyat = priceRaw ? Number(priceRaw) : null;

  if (!/^\d{4}-\d{2}$/.test(reportMonth)) redirect("/panel/muhasebe/tga?hata=ay-gecersiz");

  const settings = await prisma.integrationSetting.findUnique({ where: { id: "main" } });
  if (!settings?.tgaEnabled || !settings.tgaApiKey || !settings.tgaFacilityId) {
    redirect("/panel/muhasebe/tga?hata=ayar-eksik");
  }

  const [year, month] = reportMonth.split("-").map(Number);
  const stats = await computeMonthlyStats(year, month);

  const result = await sendTgaReport(
    {
      tgaApiKey: settings!.tgaApiKey,
      tgaSandbox: settings!.tgaSandbox,
      tgaFacilityId: settings!.tgaFacilityId,
      tgaIlKodu: settings!.tgaIlKodu,
      tgaIlceKodu: settings!.tgaIlceKodu,
      tgaOdaSayisi: settings!.tgaOdaSayisi,
      tgaYatakSayisi: settings!.tgaYatakSayisi,
    },
    reportMonth,
    stats,
    aylikOrtalamaFiyat
  );

  await prisma.tgaSubmission.upsert({
    where: { reportMonth },
    update: {
      status: result.ok ? "GONDERILDI" : "HATA",
      requestId: result.requestId ?? null,
      errorMessage: result.error ?? null,
      sentAt: new Date(),
    },
    create: {
      reportMonth,
      status: result.ok ? "GONDERILDI" : "HATA",
      requestId: result.requestId ?? null,
      errorMessage: result.error ?? null,
      sentAt: new Date(),
    },
  });

  await logActivity(
    result.ok ? "TGA aylık raporu gönderdi" : "TGA aylık rapor gönderimi başarısız oldu",
    `${reportMonth}${result.error ? ` · ${result.error}` : ""}`
  );

  revalidatePath("/panel/muhasebe/tga");
  redirect(`/panel/muhasebe/tga?ok=${result.ok ? "gonderildi" : "hata"}&ay=${reportMonth}`);
}
