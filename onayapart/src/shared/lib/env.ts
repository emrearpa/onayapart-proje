// Ortam degiskenlerine tek noktadan erisim. Hem Edge (middleware) hem Node
// ortaminda calisir - bu yuzden burada yalnizca process.env okunur.

const DEFAULT_SITE_URL = "https://onayapart.com";
/** .env.example ile gelen ornek sifre; yayinda kullanilirsa uyari verilir. */
const EXAMPLE_PANEL_PASSWORD = "onay2026";
const MIN_SECRET_LENGTH = 32;

export const env = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get siteUrl() {
    return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  },
  get panelPassword() {
    return process.env.PANEL_PASSWORD ?? "";
  },
  get sessionSecret() {
    return process.env.SESSION_SECRET ?? "";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
};

/** Yayin oncesi eksik/zayif ayarlari listeler; bos dizi her sey yolunda demektir. */
export function findEnvProblems(): string[] {
  const problems: string[] = [];
  if (!process.env.DATABASE_URL) problems.push("DATABASE_URL tanımlı değil.");
  if (!process.env.NEXT_PUBLIC_SITE_URL) problems.push(`NEXT_PUBLIC_SITE_URL tanımlı değil, ${DEFAULT_SITE_URL} varsayıldı.`);
  if (!env.panelPassword) problems.push("PANEL_PASSWORD tanımlı değil; panele giriş yapılamaz.");
  else if (env.panelPassword === EXAMPLE_PANEL_PASSWORD || env.panelPassword.length < 10) {
    problems.push("PANEL_PASSWORD zayıf (örnek değer ya da 10 karakterden kısa).");
  }
  if (env.sessionSecret.length < MIN_SECRET_LENGTH) {
    problems.push(`SESSION_SECRET en az ${MIN_SECRET_LENGTH} karakter olmalı (openssl rand -hex 32).`);
  }
  if (!env.cronSecret) problems.push("CRON_SECRET tanımlı değil; takvim senkron cron ucu yayında kapalı kalır.");
  return problems;
}
