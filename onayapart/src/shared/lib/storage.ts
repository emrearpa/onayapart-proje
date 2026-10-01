import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";

/**
 * Yuklenen dosyalar icin disk deposu. Kok klasor UPLOAD_DIR ile degistirilebilir;
 * yayinda bu klasorun kalici bir diskte (VPS diski, Docker volume) olmasi gerekir.
 * Sunucusuz barindirmada (Vercel) disk kalici degildir - orada panelde "gorsel/evrak
 * adresi" alani kullanilir.
 */
export type Bucket = "odalar" | "firma" | "personel";

const MB = 1024 * 1024;

const RULES: Record<Bucket, { maxBytes: number; extensions: Record<string, string> }> = {
  odalar: {
    maxBytes: 8 * MB,
    extensions: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" },
  },
  firma: { maxBytes: 15 * MB, extensions: documentExtensions() },
  personel: { maxBytes: 15 * MB, extensions: documentExtensions() },
};

function documentExtensions(): Record<string, string> {
  return {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

function uploadRoot(): string {
  return process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(process.cwd(), "private-uploads");
}

/** Dosya adi yalnizca kendi urettigimiz bicimdeyse yol doner; "../" gibi kacislari engeller. */
function resolveStored(bucket: Bucket, fileName: string): string | null {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(fileName) || fileName.includes("..")) return null;
  return path.join(uploadRoot(), bucket, fileName);
}

export type SavedUpload = { storedName: string; originalName: string; mimeType: string };
export type UploadError = "TOO_LARGE" | "BAD_TYPE";

export async function saveUpload(bucket: Bucket, file: File, prefix = ""): Promise<SavedUpload | UploadError> {
  const rule = RULES[bucket];
  if (file.size > rule.maxBytes) return "TOO_LARGE";

  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mimeType = rule.extensions[ext];
  if (!mimeType) return "BAD_TYPE";

  const safePrefix = prefix.replace(/[^a-z0-9]/gi, "");
  const storedName = `${safePrefix ? `${safePrefix}-` : ""}${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(uploadRoot(), bucket);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), Buffer.from(await file.arrayBuffer()));

  return { storedName, originalName: file.name, mimeType };
}

export async function readUpload(bucket: Bucket, storedName: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  const filePath = resolveStored(bucket, storedName);
  if (!filePath) return null;
  try {
    const bytes = await readFile(filePath);
    const ext = (storedName.split(".").pop() ?? "").toLowerCase();
    return { bytes, mimeType: RULES[bucket].extensions[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/** Dosya zaten yoksa sessizce gecer. */
export async function deleteUpload(bucket: Bucket, storedName: string): Promise<void> {
  const filePath = resolveStored(bucket, storedName);
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch {
    // dosya zaten yoksa yoksay
  }
}

export function isExternalUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/** Oda fotograflarinin herkese acik adresi (bkz. app/media/odalar/[file]/route.ts). */
export const ROOM_PHOTO_URL_PREFIX = "/media/odalar/";
