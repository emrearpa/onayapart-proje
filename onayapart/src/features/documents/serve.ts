import { NextResponse } from "next/server";
import { fileResponse, jsonError } from "@/shared/lib/http";
import { isExternalUrl, readUpload, type Bucket } from "@/shared/lib/storage";

/** Kayitli bir evraki yanit olarak dondurur: bulut linkiyse yonlendirir, degilse diskten okur. */
export async function serveStoredDocument(bucket: Bucket, doc: { filePath: string; fileName: string } | null) {
  if (!doc) return jsonError("Dosya bulunamadı.", 404);
  if (isExternalUrl(doc.filePath)) return NextResponse.redirect(doc.filePath);

  const file = await readUpload(bucket, doc.filePath);
  if (!file) return jsonError("Dosya diskte bulunamadı.", 404);
  return fileResponse(new Uint8Array(file.bytes), file.mimeType, { fileName: doc.fileName });
}
