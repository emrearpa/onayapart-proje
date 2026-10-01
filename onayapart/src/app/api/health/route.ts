import { NextResponse } from "next/server";
import { prisma } from "@/shared/lib/db";

export const dynamic = "force-dynamic";

/** Saglik kontrolu: yuk dengeleyici / Docker HEALTHCHECK / izleme servisleri icin. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "error", detail: "database unreachable" }, { status: 503 });
  }
}
