import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getFinanceTotals,
  getExpenseByCategory,
  getIncomeByMethod,
  getAccountSummaries,
  getMonthlyProfitLoss,
} from "@/lib/queries";
import { resolveRange } from "@/lib/dateRange";
import { generateReportPdf } from "@/lib/reportPdf";

/** Muhasebe rapor PDF'i - sadece tam admin girisiyle indirilebilir. */
export async function GET(req: Request) {
  const panelCookie = cookies().get("oa_panel")?.value;
  const isAdmin = Boolean(panelCookie) && Boolean(process.env.PANEL_PASSWORD) && panelCookie === process.env.PANEL_PASSWORD;
  if (!isAdmin) {
    return NextResponse.json({ error: "Bu raporu indirme yetkiniz yok." }, { status: 403 });
  }

  const url = new URL(req.url);
  const range = resolveRange(
    url.searchParams.get("aralik") ?? undefined,
    url.searchParams.get("bas") ?? undefined,
    url.searchParams.get("bit") ?? undefined
  );

  const [totals, expenseByCategory, incomeByMethod, accountSummaries, monthlyReport] = await Promise.all([
    getFinanceTotals(range.start, range.end),
    getExpenseByCategory(range.start, range.end),
    getIncomeByMethod(range.start, range.end),
    getAccountSummaries(range.start, range.end),
    getMonthlyProfitLoss(12),
  ]);

  const pdfBytes = await generateReportPdf({
    rangeLabel: range.label,
    generatedAt: new Date(),
    totals,
    incomeByMethod,
    expenseByCategory,
    accountSummaries,
    monthlyReport,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="on-muhasebe-raporu-${range.preset}.pdf"`,
    },
  });
}
