import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

type FileOptions = { fileName: string; download?: boolean; cacheControl?: string };

/** Ikili icerigi (PDF, gorsel, CSV ...) dogru basliklarla dondurur. */
export function fileResponse(body: Uint8Array | string, contentType: string, { fileName, download = false, cacheControl = "private, no-store" }: FileOptions) {
  // Baslikta yalnizca ASCII guvenlidir; Turkce karakterli adlar RFC 5987 ile ayrica verilir.
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
