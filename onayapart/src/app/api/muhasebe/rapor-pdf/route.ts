import { fileResponse, jsonError } from "@/shared/lib/http";
import { can, getPanelSession } from "@/features/auth/guards";
import { resolveRange } from "@/features/accounting/date-range";
import {
  getAccountSummaries,
  getExpenseByCategory,
  getFinanceTotals,
  getIncomeByMethod,
  getMonthlyProfitLoss,
} from "@/features/accounting/queries";
import { generateReportPdf } from "@/features/accounting/report-pdf";

/** Muhasebe rapor PDF'i (admin ya da "On Muhasebe" yetkisi). */
export async function GET(req: Request) {
  if (!can(await getPanelSession(), "muhasebe")) return jsonError("Bu raporu indirme yetkiniz yok.", 403);

  const query = new URL(req.url).searchParams;
  const range = resolveRange(query.get("aralik") ?? undefined, query.get("bas") ?? undefined, query.get("bit") ?? undefined);

  const [totals, expenseByCategory, incomeByMethod, accountSummaries, monthlyReport] = await Promise.all([
    getFinanceTotals(range.start, range.end),
    getExpenseByCategory(range.start, range.end),
    getIncomeByMethod(range.start, range.end),
    getAccountSummaries(range.start, range.end),
    getMonthlyProfitLoss(12),
  ]);

  const pdf = await generateReportPdf({
    rangeLabel: range.label,
    generatedAt: new Date(),
    totals,
    incomeByMethod,
    expenseByCategory,
    accountSummaries,
    monthlyReport,
  });

  return fileResponse(pdf, "application/pdf", { fileName: `on-muhasebe-raporu-${range.preset}.pdf`, download: true });
}
