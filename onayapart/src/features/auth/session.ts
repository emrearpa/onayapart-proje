// Imzali oturum token'lari. Hem middleware.ts (Edge) hem server action'lar (Node)
// icinde calisir - bu yuzden SADECE Web Crypto API kullanilir; Buffer veya Node'a
// ozel baska bir API kullanilmaz.

import { env } from "@/shared/lib/env";

export const SESSION_COOKIES = { admin: "oa_panel", staff: "oa_staff", guest: "oa_guest" } as const;
export type SessionKind = keyof typeof SESSION_COOKIES;

const DAY = 60 * 60 * 24;
export const SESSION_TTL: Record<SessionKind, number> = { admin: 7 * DAY, staff: 7 * DAY, guest: 30 * DAY };

type SessionData = {
  admin: Record<string, never>;
  staff: { userId: string; fullName: string; permissions: string[] };
  guest: { guestId: string };
};
export type Session<K extends SessionKind> = SessionData[K];

const TOKEN_VERSION = "v1";
const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(text: string): string {
  let binary = "";
  for (const b of encoder.encode(text)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(b64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/** Zamanlama saldirilarina karsi sabit zamanli metin karsilastirmasi. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Imza anahtari. Panel sifresi anahtarin parcasidir: sifre degisince acik tum
 * oturumlar kendiliginden gecersiz olur. Sifre tanimli degilse bos doner ve
 * hicbir oturum dogrulanamaz (sistem kapali kalir).
 */
function signingSecret(): string {
  return env.panelPassword ? `${env.sessionSecret}|${env.panelPassword}` : "";
}

/** Girilen admin sifresini, uzunluk bilgisi sizdirmadan dogrular. */
export async function isAdminPassword(candidate: string): Promise<boolean> {
  const secret = signingSecret();
  if (!secret || !candidate) return false;
  const [a, b] = await Promise.all([hmac(secret, candidate), hmac(secret, env.panelPassword)]);
  return safeEqual(a, b);
}

export async function createSessionToken<K extends SessionKind>(kind: K, data: Session<K>): Promise<string> {
  const secret = signingSecret();
  if (!secret) throw new Error("PANEL_PASSWORD tanimli olmadan oturum acilamaz.");
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL[kind];
  const body = `${TOKEN_VERSION}.${toBase64Url(JSON.stringify({ kind, exp, ...data }))}`;
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifySessionToken<K extends SessionKind>(
  kind: K,
  token: string | undefined | null
): Promise<Session<K> | null> {
  const secret = signingSecret();
  if (!token || !secret) return null;

  const [version, payload, signature] = token.split(".");
  if (version !== TOKEN_VERSION || !payload || !signature) return null;
  if (!safeEqual(await hmac(secret, `${version}.${payload}`), signature)) return null;

  try {
    const { kind: tokenKind, exp, ...data } = JSON.parse(fromBase64Url(payload));
    if (tokenKind !== kind || typeof exp !== "number" || exp * 1000 < Date.now()) return null;
    return data as Session<K>;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(kind: SessionKind) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProduction,
    path: "/",
    maxAge: SESSION_TTL[kind],
  };
}
