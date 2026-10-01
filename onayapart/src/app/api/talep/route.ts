import { NextResponse } from "next/server";
import { jsonError } from "@/shared/lib/http";
import { consumeAttempt } from "@/shared/lib/rate-limit";
import { createLead } from "@/features/leads/create-lead";

/** Sitedeki "Sizi arayalim" formu. */
export async function POST(req: Request) {
  if (!consumeAttempt("lead")) return jsonError("Çok fazla talep gönderildi, lütfen biraz sonra tekrar deneyin.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Geçersiz istek.", 400);
  }
  if (typeof body !== "object" || body === null) return jsonError("Geçersiz istek.", 400);

  try {
    const result = await createLead(body);
    return result.ok ? NextResponse.json({ ok: true }) : jsonError(result.error, 400);
  } catch (error) {
    console.error("[talep] kaydedilemedi:", error);
    return jsonError("Talep kaydedilemedi.", 500);
  }
}
