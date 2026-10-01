import type { IntegrationSetting } from "@prisma/client";
import { prisma } from "@/shared/lib/db";

const INTEGRATION_SETTINGS_ID = "main";

type IntegrationFields = Partial<Omit<IntegrationSetting, "id" | "updatedAt">>;

/** WhatsApp, e-posta, SMS, iyzico ve TGA baglanti ayarlari (tek satir). Satir yoksa olusturur. */
export async function getIntegrationSettings() {
  return prisma.integrationSetting.upsert({
    where: { id: INTEGRATION_SETTINGS_ID },
    update: {},
    create: { id: INTEGRATION_SETTINGS_ID },
  });
}

/**
 * Ayarlari gunceller. `secrets` icindeki alanlar (API anahtari, sifre) formda bos
 * birakilmissa mevcut deger korunur - her kaydetmede yeniden yapistirmak gerekmez.
 */
export async function updateIntegrationSettings(data: IntegrationFields, secrets: IntegrationFields = {}) {
  const provided = Object.fromEntries(Object.entries(secrets).filter(([, value]) => Boolean(value)));
  const merged: IntegrationFields = { ...data, ...provided };
  return prisma.integrationSetting.upsert({
    where: { id: INTEGRATION_SETTINGS_ID },
    update: merged,
    create: { id: INTEGRATION_SETTINGS_ID, ...merged },
  });
}
