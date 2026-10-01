import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLedgerInRange, getAccountTypeLedger, getCardTransactions, getAccountStatement } from "@/features/accounting/queries";
import { resolveRange } from "@/features/accounting/date-range";
import { buildLedgerCsv, buildStatementCsv } from "@/features/accounting/csv";

/**
 * Muhasebe CSV/Excel disa aktarimi - sadece tam admin girisiyle indirilebilir.
 * ?kind= rapor | kasa | banka | pos | ekstre  (varsayilan: rapor)
 * ekstre icin ayrica ?hesap=<accountId> gerekir.
 */
export async function GET(req: Request) {
  const panelCookie = cookies().get("oa_panel")?.value;
  const isAdmin = Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;
  if (!isAdmin) {
    return NextResponse.json({ error: "Bu dosyayı indirme yetkiniz yok." }, { status: 403 });
  }

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "rapor";
  const range = resolveRange(
    url.searchParams.get("aralik") ?? undefined,
    url.searchParams.get("bas") ?? undefined,
    url.searchParams.get("bit") ?? undefined
  );

  let csv: string;
  let filename: string;

  if (kind === "ekstre") {
    const accountId = url.searchParams.get("hesap");
    if (!accountId) {
      return NextResponse.json({ error: "Hesap seçimi eksik." }, { status: 400 });
    }
    const statement = await getAccountStatement(accountId, range.start, range.end);
    if (!statement) {
      return NextResponse.json({ error: "Hesap bulunamadı." }, { status: 404 });
    }
    csv = buildStatementCsv(statement);
    filename = `hesap-ekstresi-${range.preset}.csv`;
  } else if (kind === "kasa") {
    csv = buildLedgerCsv(await getAccountTypeLedger("KASA", range.start, range.end));
    filename = `kasa-hareketleri-${range.preset}.csv`;
  } else if (kind === "banka") {
    csv = buildLedgerCsv(await getAccountTypeLedger("BANKA", range.start, range.end));
    filename = `banka-hareketleri-${range.preset}.csv`;
  } else if (kind === "pos") {
    csv = buildLedgerCsv(await getCardTransactions(range.start, range.end));
    filename = `pos-islemleri-${range.preset}.csv`;
  } else {
    csv = buildLedgerCsv(await getLedgerInRange(range.start, range.end));
    filename = `on-muhasebe-raporu-${range.preset}.csv`;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
