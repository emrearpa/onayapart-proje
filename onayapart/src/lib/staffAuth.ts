// Bu dosya hem middleware.ts (Edge ortami) hem panel/actions.ts (Node ortami) icinde
// calisir. Bu yuzden SADECE Web Crypto API (crypto.subtle) ve Uint8Array kullanilir;
// Buffer veya Node'a ozel baska bir API kullanilmaz - ikisinde de calismasi bunu gerektirir.

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, "+").replace(/_/g, "/").padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toHex(sig);
}

/* ---------------------------------------------------------------- */
/* Sifre hashleme - PBKDF2 (Web Crypto), bcrypt gibi native derleme  */
/* gerektiren bir pakete ihtiyac duymadan calisir.                   */
/* ---------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toHex(saltBytes.buffer);
  const hash = await pbkdf2(password, salt);
  return { salt, hash };
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  const candidate = await pbkdf2(password, salt);
  if (candidate.length !== hash.length) return false;
  // Zamanlama saldirilarina karsi basit sabit-zamanli karsilastirma.
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

/* ---------------------------------------------------------------- */
/* Imzali oturum token'i - staff girisinde uretilir, middleware'de   */
/* veritabanina gitmeden dogrulanir.                                 */
/* ---------------------------------------------------------------- */

export type StaffSession = { userId: string; fullName: string; permissions: string[] };

export async function createStaffSessionToken(secret: string, session: StaffSession): Promise<string> {
  const payloadB64 = toBase64Url(JSON.stringify(session));
  const sig = await hmac(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifyStaffSessionToken(
  secret: string,
  token: string | undefined | null
): Promise<StaffSession | null> {
  if (!token || !secret) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = await hmac(secret, payloadB64);
  if (expected !== sig) return null;

  try {
    return JSON.parse(fromBase64Url(payloadB64)) as StaffSession;
  } catch {
    return null;
  }
}

export const PERMISSIONS = [
  { key: "rezervasyonlar", label: "Rezervasyonlar" },
  { key: "musteriler", label: "Müşteriler" },
  { key: "muhasebe", label: "Ön Muhasebe" },
  { key: "personel", label: "Personel" },
  { key: "bakim", label: "Bakım talepleri" },
  { key: "envanter", label: "Envanter / Stok" },
  { key: "menu", label: "Restoran Menüsü" },
  { key: "evraklar", label: "Firma Evrakları" },
  { key: "istakibi", label: "İş Takibi" },
  { key: "bilgilendirme", label: "Bilgilendirme (WhatsApp)" },
  { key: "odalar", label: "Oda tipleri ve odalar" },
  { key: "icerik", label: "Site içeriği" },
  { key: "talepler", label: "Siteden gelen talepler" },
] as const;

/** URL yoluna gore hangi izin anahtarinin gerektigini soyler. Eslesme yoksa (orn.
 *  /panel kok sayfasi veya /panel/kullanicilar) sadece tam admin erisebilir demektir. */
export function permissionForPath(pathname: string): string | null {
  const map: { prefix: string; key: string }[] = [
    { prefix: "/panel/rezervasyonlar", key: "rezervasyonlar" },
    { prefix: "/panel/musteriler", key: "musteriler" },
    { prefix: "/panel/muhasebe", key: "muhasebe" },
    { prefix: "/panel/personel", key: "personel" },
    { prefix: "/panel/bakim-talepleri", key: "bakim" },
    { prefix: "/panel/envanter", key: "envanter" },
    { prefix: "/panel/menu", key: "menu" },
    { prefix: "/panel/evraklar", key: "evraklar" },
    { prefix: "/panel/is-takibi", key: "istakibi" },
    { prefix: "/panel/bilgilendirme", key: "bilgilendirme" },
    { prefix: "/panel/tipler", key: "odalar" },
    { prefix: "/panel/odalar", key: "odalar" },
    { prefix: "/panel/icerik", key: "icerik" },
    { prefix: "/panel/talepler", key: "talepler" },
  ];
  const hit = map.find((m) => pathname.startsWith(m.prefix));
  return hit?.key ?? null;
}

/** Bir izin anahtarinin panelde karsilik geldigi ilk sayfa yolu (yonlendirme icin). */
export function pathForPermission(key: string): string {
  const first: Record<string, string> = {
    rezervasyonlar: "/panel/rezervasyonlar",
    musteriler: "/panel/musteriler",
    muhasebe: "/panel/muhasebe",
    personel: "/panel/personel",
    bakim: "/panel/bakim-talepleri",
    envanter: "/panel/envanter",
    menu: "/panel/menu",
    evraklar: "/panel/evraklar",
    istakibi: "/panel/is-takibi",
    bilgilendirme: "/panel/bilgilendirme",
    odalar: "/panel/odalar",
    icerik: "/panel/icerik",
    talepler: "/panel/talepler",
  };
  return first[key] ?? "/panel/giris";
}
