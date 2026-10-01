import { fileResponse, jsonError } from "@/shared/lib/http";
import { readUpload } from "@/shared/lib/storage";

/**
 * Panelden yuklenen oda fotograflarini sunar. Dosyalar public/ yerine yukleme
 * klasorunde durur: public/ yalnizca derleme anindaki dosyalari sunar, sonradan
 * yuklenenler orada gorunmez. Dosya adlari benzersiz oldugundan uzun sure onbelleklenir.
 */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const photo = await readUpload("odalar", params.file);
  if (!photo) return jsonError("Görsel bulunamadı.", 404);

  return fileResponse(new Uint8Array(photo.bytes), photo.mimeType, {
    fileName: params.file,
    cacheControl: "public, max-age=31536000, immutable",
  });
}
