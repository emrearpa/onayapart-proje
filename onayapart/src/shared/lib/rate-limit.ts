import { headers } from "next/headers";

/**
 * Giris denemeleri icin bellek ici sayac (kaba kuvvet korumasi). Tek sunucuda
 * (VPS/Docker) tam calisir; sunucusuz ortamda her ornek kendi sayacini tutar,
 * yani koruma "en iyi caba" duzeyindedir.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const MAX_TRACKED_KEYS = 10_000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function clientIp(): string {
  const h = headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function prune(now: number) {
  if (attempts.size < MAX_TRACKED_KEYS) return;
  for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
}

/** Deneme hakki kaldiysa true doner ve denemeyi sayar. */
export function consumeAttempt(scope: string): boolean {
  const now = Date.now();
  const key = `${scope}:${clientIp()}`;
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    prune(now);
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_ATTEMPTS;
}

export function clearAttempts(scope: string) {
  attempts.delete(`${scope}:${clientIp()}`);
}
