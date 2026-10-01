import { NextResponse } from "next/server";
import { env } from "@/shared/lib/env";
import { jsonError } from "@/shared/lib/http";
import { safeEqual } from "@/features/auth/session";
import { syncAllExternalCalendars } from "@/features/calendar-sync/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Booking.com/Airbnb takvimlerini topluca senkronize eder. Zamanlayici tarafindan
 * "Authorization: Bearer <CRON_SECRET>" basligiyla cagrilir (Vercel Cron bunu
 * kendiliginden ekler; kendi sunucunuzda cron/curl ile siz eklersiniz).
 * Yayinda CRON_SECRET tanimli degilse uc nokta kapali kalir.
 */
export async function GET(req: Request) {
  if (env.cronSecret) {
    const provided = req.headers.get("authorization") ?? "";
    if (!safeEqual(provided, `Bearer ${env.cronSecret}`)) return jsonError("Yetkisiz.", 401);
  } else if (env.isProduction) {
    return jsonError("CRON_SECRET tanımlı değil.", 503);
  }

  return NextResponse.json(await syncAllExternalCalendars());
}
