"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/shared/lib/db";
import { checked, positiveNum, str } from "@/shared/lib/form";
import { requirePanel } from "@/features/auth/guards";
import { logActivity } from "@/features/audit/activity-log";
import { computeMonthlyStats, sendTgaReport } from "@/features/accounting/tga";
import { getIntegrationSettings, updateIntegrationSettings } from "@/features/integrations/settings";

const PAGE_PATH = "/panel/muhasebe/tga";

export async function updateTgaSettings(formData: FormData) {
  await requirePanel("muhasebe");
  const tgaEnabled = checked(formData, "tgaEnabled");
  const existing = await getIntegrationSettings();

  await updateIntegrationSettings(
    {
      tgaEnabled,
      tgaSandbox: checked(formData, "tgaSandbox"),
      tgaIlKodu: str(formData, "tgaIlKodu"),
      tgaIlceKodu: str(formData, "tgaIlceKodu"),
      tgaOdaSayisi: Math.trunc(positiveNum(formData, "tgaOdaSayisi")),
      tgaYatakSayisi: Math.trunc(positiveNum(formData, "tgaYatakSayisi")),
      // Tesis kimligi bir kere uretilir ve hep ayni kalir (TGA'da "ayni tesis" olarak taninmasi icin).
      tgaFacilityId: existing.tgaFacilityId || randomUUID(),
    },
    { tgaApiKey: str(formData, "tgaApiKey") }
  );

  await logActivity("TGA ayarlarını güncelledi", tgaEnabled ? "Etkinleştirildi" : "Devre dışı bırakıldı");
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?ok=ayar`);
}

export async function sendTgaReportAction(formData: FormData) {
  await requirePanel("muhasebe");
  const reportMonth = str(formData, "reportMonth");
  const averagePrice = positiveNum(formData, "aylikOrtalamaFiyat") || null;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(reportMonth)) redirect(`${PAGE_PATH}?hata=ay-gecersiz`);

  const settings = await getIntegrationSettings();
  if (!settings.tgaEnabled || !settings.tgaApiKey || !settings.tgaFacilityId) redirect(`${PAGE_PATH}?hata=ayar-eksik`);

  const [year, month] = reportMonth.split("-").map(Number);
  const result = await sendTgaReport(settings, reportMonth, await computeMonthlyStats(year, month), averagePrice);

  const outcome = {
    status: result.ok ? "GONDERILDI" : "HATA",
    requestId: result.requestId ?? null,
    errorMessage: result.error ?? null,
    sentAt: new Date(),
  };
  await prisma.tgaSubmission.upsert({ where: { reportMonth }, update: outcome, create: { reportMonth, ...outcome } });

  await logActivity(
    result.ok ? "TGA aylık raporu gönderdi" : "TGA aylık rapor gönderimi başarısız oldu",
    `${reportMonth}${result.error ? ` · ${result.error}` : ""}`
  );
  revalidatePath(PAGE_PATH);
  redirect(`${PAGE_PATH}?ok=${result.ok ? "gonderildi" : "hata"}&ay=${reportMonth}`);
}
