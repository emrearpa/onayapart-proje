import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "fs/promises";
import path from "path";

export const PAGE_W = 595.28; // A4 genislik (pt)
export const PAGE_H = 841.89; // A4 yukseklik (pt)
export const MARGIN = 50;
export const CONTENT_W = PAGE_W - MARGIN * 2;

export const PDF_COLORS = {
  brand: rgb(0.11, 0.376, 0.271), // #1c6045
  ink: rgb(0.075, 0.125, 0.098), // #132019
  soft: rgb(0.306, 0.384, 0.349), // #4e6259
  line: rgb(0.878, 0.914, 0.89), // #e0e9e3
  danger: rgb(0.753, 0.208, 0.176), // ~#c0453f
};

export type PdfCtx = {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  y: number;
};

export async function createPdfDoc(): Promise<{ doc: PDFDocument; font: PDFFont; bold: PDFFont }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "assets", "fonts", "DejaVuSans.ttf")),
    readFile(path.join(process.cwd(), "assets", "fonts", "DejaVuSans-Bold.ttf")),
  ]);
  const font = await doc.embedFont(regularBytes, { subset: true });
  const bold = await doc.embedFont(boldBytes, { subset: true });

  return { doc, font, bold };
}

export function newPage(ctx: PdfCtx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

export function ensureSpace(ctx: PdfCtx, needed: number) {
  if (ctx.y - needed < MARGIN) newPage(ctx);
}

export function wrapText(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (current && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawParagraph(
  ctx: PdfCtx,
  text: string,
  opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; lineGap?: number; maxWidth?: number } = {}
) {
  const size = opts.size ?? 10;
  const font = opts.bold ? ctx.bold : ctx.font;
  const color = opts.color ?? PDF_COLORS.ink;
  const lineGap = opts.lineGap ?? size * 1.45;
  const maxWidth = opts.maxWidth ?? CONTENT_W;
  for (const line of wrapText(font, text, size, maxWidth)) {
    ensureSpace(ctx, lineGap);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y - size, size, font, color });
    ctx.y -= lineGap;
  }
}

export function drawHeading(ctx: PdfCtx, text: string) {
  ensureSpace(ctx, 30);
  ctx.y -= 8;
  ctx.page.drawText(text, { x: MARGIN, y: ctx.y - 12, size: 12, font: ctx.bold, color: PDF_COLORS.brand });
  ctx.y -= 22;
}

export function drawRow(ctx: PdfCtx, label: string, value: string, valueColor?: ReturnType<typeof rgb>) {
  ensureSpace(ctx, 16);
  ctx.page.drawText(label, { x: MARGIN, y: ctx.y - 9, size: 9.5, font: ctx.bold, color: PDF_COLORS.soft });
  ctx.page.drawText(value || "—", { x: MARGIN + 220, y: ctx.y - 9, size: 9.5, font: ctx.font, color: valueColor ?? PDF_COLORS.ink });
  ctx.y -= 16;
}

export function drawDivider(ctx: PdfCtx) {
  ensureSpace(ctx, 14);
  ctx.y -= 4;
  ctx.page.drawLine({ start: { x: MARGIN, y: ctx.y }, end: { x: PAGE_W - MARGIN, y: ctx.y }, thickness: 0.75, color: PDF_COLORS.line });
  ctx.y -= 12;
}

/** Basit, sutun genislikleri esit ya da orantili bir tablo. colWidths verilmezse esit bolunur. */
export function drawTable(
  ctx: PdfCtx,
  headers: string[],
  rows: { cells: string[]; color?: ReturnType<typeof rgb>; bold?: boolean }[],
  colWidths?: number[]
) {
  const widths = colWidths ?? headers.map(() => CONTENT_W / headers.length);
  const rowHeight = 18;

  function drawHeaderRow() {
    ensureSpace(ctx, rowHeight + 4);
    let x = MARGIN;
    for (let i = 0; i < headers.length; i++) {
      const align = i === 0 ? "left" : "right";
      const w = widths[i];
      const size = 8.5;
      const textW = ctx.bold.widthOfTextAtSize(headers[i], size);
      const tx = align === "right" ? x + w - textW : x;
      ctx.page.drawText(headers[i], { x: tx, y: ctx.y - 9, size, font: ctx.bold, color: PDF_COLORS.soft });
      x += w;
    }
    ctx.y -= rowHeight;
    drawDivider(ctx);
  }

  drawHeaderRow();

  for (const row of rows) {
    ensureSpace(ctx, rowHeight);
    let x = MARGIN;
    for (let i = 0; i < row.cells.length; i++) {
      const align = i === 0 ? "left" : "right";
      const w = widths[i];
      const size = 9;
      const font = row.bold ? ctx.bold : ctx.font;
      const color = row.color ?? PDF_COLORS.ink;
      const text = row.cells[i];
      const textW = font.widthOfTextAtSize(text, size);
      const tx = align === "right" ? x + w - textW : x;
      ctx.page.drawText(text, { x: tx, y: ctx.y - 9, size, font, color });
      x += w;
    }
    ctx.y -= rowHeight;
  }
}
