import { fmtDate } from "@/lib/dates";
import type { LedgerEntry, StatementRow } from "@/lib/queries";

const METHOD_LABEL: Record<string, string> = { NAKIT: "Nakit", KART: "Kart", HAVALE: "Havale" };
const TYPE_LABEL: Record<string, string> = { GELIR: "Gelir", GIDER: "Gider" };

/** Turk Excel'i noktali virgul ayracı ve virgullu ondalik bekler. */
function csvNumber(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function csvCell(v: string): string {
  const needsQuotes = /[;"\n]/.test(v);
  const escaped = v.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(";"));
  // UTF-8 BOM: Excel Turkce karakterleri (ş, ğ, ı, ö, ü, ç) dogru gostersin diye.
  return "\uFEFF" + lines.join("\r\n");
}

export function buildLedgerCsv(entries: LedgerEntry[]): string {
  const headers = ["Tarih", "Tür", "Açıklama", "Kategori", "Hesap", "Yöntem", "Tutar"];
  const rows = entries.map((e) => [
    fmtDate(e.date),
    TYPE_LABEL[e.type] ?? e.type,
    e.title,
    e.category,
    e.accountName,
    METHOD_LABEL[e.method] ?? e.method,
    csvNumber(e.type === "GIDER" ? -e.amount : e.amount),
  ]);

  const totalIncome = entries.filter((e) => e.type === "GELIR").reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === "GIDER").reduce((s, e) => s + e.amount, 0);
  rows.push([]);
  rows.push(["", "", "", "", "", "Toplam Gelir", csvNumber(totalIncome)]);
  rows.push(["", "", "", "", "", "Toplam Gider", csvNumber(totalExpense)]);
  rows.push(["", "", "", "", "", "Net", csvNumber(totalIncome - totalExpense)]);

  return toCsv(headers, rows);
}

export function buildStatementCsv(statement: {
  account: { name: string };
  opening: number;
  rows: StatementRow[];
  closing: number;
}): string {
  const headers = ["Tarih", "Açıklama", "Yöntem", "Giriş", "Çıkış", "Bakiye"];
  const rows: string[][] = [["", `Devir Bakiyesi (${statement.account.name})`, "", "", "", csvNumber(statement.opening)]];

  for (const r of statement.rows) {
    rows.push([
      fmtDate(r.date),
      r.title,
      METHOD_LABEL[r.method] ?? r.method,
      r.type === "GELIR" ? csvNumber(r.amount) : "",
      r.type === "GIDER" ? csvNumber(r.amount) : "",
      csvNumber(r.balance),
    ]);
  }
  rows.push(["", "Dönem Sonu Bakiye", "", "", "", csvNumber(statement.closing)]);

  return toCsv(headers, rows);
}
