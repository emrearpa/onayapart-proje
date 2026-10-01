import { NextResponse } from "next/server";
import { syncAllExternalCalendars } from "@/features/calendar-sync/sync";

/**
 * Vercel Cron tarafindan otomatik cagrilir (vercel.json'daki schedule'a gore).
 * Vercel, cron isteklerine "Authorization: Bearer <CRON_SECRET>" basligini otomatik ekler;
 * CRON_SECRET ortam degiskeni tanimliysa burada dogrulanir. Tanimli degilse (yerel gelistirme)
 * kontrol atlanir.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }
  }

  const result = await syncAllExternalCalendars();
  return NextResponse.json(result);
}
