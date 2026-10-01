import {
  createPdfDoc,
  drawParagraph,
  drawHeading,
  drawRow,
  drawDivider,
  drawTable,
  PDF_COLORS,
  PAGE_W,
  PAGE_H,
  MARGIN,
  CONTENT_W,
  type PdfCtx,
} from "@/shared/lib/pdf-kit";
import { fmtDate, fmtMoney } from "@/shared/lib/dates";

const CONTENT_W_HALF = CONTENT_W / 2;

export type ReportInput = {
  rangeLabel: string;
  generatedAt: Date;
  totals: { income: number; expense: number; profit: number; reservationIncome: number; otherIncome: number };
  incomeByMethod: Record<string, number>;
  expenseByCategory: { label: string; amount: number }[];
  accountSummaries: { name: string; type: string; inflow: number; outflow: number }[];
  monthlyReport: { label: string; income: number; expense: number; profit: number }[];
};

const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };
const ACCOUNT_TYPE_LABEL: Record<string, string> = { KASA: "Kasa", BANKA: "Banka / POS" };

export async function generateReportPdf(input: ReportInput): Promise<Uint8Array> {
  const { rangeLabel, generatedAt, totals, incomeByMethod, expenseByCategory, accountSummaries, monthlyReport } = input;

  const { doc, font, bold } = await createPdfDoc();
  const ctx: PdfCtx = { doc, page: doc.addPage([PAGE_W, PAGE_H]), font, bold, y: PAGE_H - MARGIN };

  ctx.page.drawText("ÖN MUHASEBE RAPORU", { x: MARGIN, y: ctx.y - 20, size: 18, font: bold, color: PDF_COLORS.brand });
  ctx.y -= 32;
  drawParagraph(ctx, `Dönem: ${rangeLabel}   ·   Oluşturulma: ${fmtDate(generatedAt)}`, { size: 9.5, color: PDF_COLORS.soft });
  drawDivider(ctx);

  drawHeading(ctx, "A. ÖZET");
  drawRow(ctx, "Toplam Gelir", fmtMoney(totals.income));
  drawRow(ctx, "Toplam Gider", fmtMoney(totals.expense));
  drawRow(ctx, "Net Kâr / Zarar", fmtMoney(totals.profit), totals.profit >= 0 ? PDF_COLORS.brand : PDF_COLORS.danger);
  drawRow(ctx, "Konaklama Tahsilatı", fmtMoney(totals.reservationIncome));
  drawRow(ctx, "Diğer Gelirler", fmtMoney(totals.otherIncome));
  drawRow(ctx, "Kredi Kartı Tahsilatı", fmtMoney(incomeByMethod.KART ?? 0));

  drawHeading(ctx, "B. TAHSİLAT YÖNTEMİNE GÖRE GELİR");
  drawTable(
    ctx,
    ["Yöntem", "Tutar"],
    (["NAKIT", "KART", "HAVALE"] as const).map((m) => ({ cells: [METHOD_LABEL[m], fmtMoney(incomeByMethod[m] ?? 0)] })),
    [CONTENT_W_HALF, CONTENT_W_HALF]
  );

  drawHeading(ctx, "C. GİDERİN KATEGORİ DAĞILIMI");
  if (expenseByCategory.length > 0) {
    drawTable(
      ctx,
      ["Kategori", "Tutar"],
      expenseByCategory.map((c) => ({ cells: [c.label, fmtMoney(c.amount)] })),
      [CONTENT_W_HALF, CONTENT_W_HALF]
    );
  } else {
    drawParagraph(ctx, "Bu dönemde gider kaydı yok.", { size: 9.5, color: PDF_COLORS.soft });
  }

  drawHeading(ctx, "D. KASA VE BANKA — DÖNEM ÖZETİ");
  if (accountSummaries.length > 0) {
    drawTable(
      ctx,
      ["Hesap", "Tür", "Dönem Girişi", "Dönem Çıkışı"],
      accountSummaries.map((s) => ({
        cells: [s.name, ACCOUNT_TYPE_LABEL[s.type] ?? s.type, fmtMoney(s.inflow), fmtMoney(s.outflow)],
      })),
      [CONTENT_W * 0.34, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.22]
    );
  } else {
    drawParagraph(ctx, "Kayıtlı kasa/banka hesabı yok.", { size: 9.5, color: PDF_COLORS.soft });
  }

  drawHeading(ctx, "E. AYLIK KÂR / ZARAR — SON 12 AY");
  drawTable(
    ctx,
    ["Ay", "Gelir", "Gider", "Kâr / Zarar"],
    monthlyReport.map((m) => ({
      cells: [m.label, fmtMoney(m.income), fmtMoney(m.expense), fmtMoney(m.profit)],
      color: m.profit >= 0 ? undefined : PDF_COLORS.danger,
    })),
    [CONTENT_W * 0.34, CONTENT_W * 0.22, CONTENT_W * 0.22, CONTENT_W * 0.22]
  );

  drawParagraph(
    ctx,
    "Bu rapor işletme içi takip amaçlıdır; resmi muhasebe kayıtlarınızın (e-defter, KDV/muhtasar beyannameleri) yerine geçmez.",
    { size: 8, color: PDF_COLORS.soft, lineGap: 12 }
  );

  return doc.save();
}
