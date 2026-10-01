import { fileResponse, jsonError } from "@/shared/lib/http";
import { can, getPanelSession } from "@/features/auth/guards";
import { buildLedgerCsv, buildStatementCsv } from "@/features/accounting/csv";
import { resolveRange } from "@/features/accounting/date-range";
import { getAccountStatement, getAccountTypeLedger, getCardTransactions, getLedgerInRange } from "@/features/accounting/queries";

type Range = { start: Date; end: Date };

const LEDGERS: Record<string, { fileName: string; load: (range: Range) => ReturnType<typeof getLedgerInRange> }> = {
  rapor: { fileName: "on-muhasebe-raporu", load: (r) => getLedgerInRange(r.start, r.end) },
  kasa: { fileName: "kasa-hareketleri", load: (r) => getAccountTypeLedger("KASA", r.start, r.end) },
  banka: { fileName: "banka-hareketleri", load: (r) => getAccountTypeLedger("BANKA", r.start, r.end) },
  pos: { fileName: "pos-islemleri", load: (r) => getCardTransactions(r.start, r.end) },
};

/**
 * Muhasebe CSV/Excel disa aktarimi (admin ya da "On Muhasebe" yetkisi).
 * ?kind= rapor | kasa | banka | pos | ekstre  (varsayilan: rapor)
 * ekstre icin ayrica ?hesap=<accountId> gerekir.
 */
export async function GET(req: Request) {
  if (!can(await getPanelSession(), "muhasebe")) return jsonError("Bu dosyayı indirme yetkiniz yok.", 403);

  const query = new URL(req.url).searchParams;
  const kind = query.get("kind") ?? "rapor";
  const range = resolveRange(query.get("aralik") ?? undefined, query.get("bas") ?? undefined, query.get("bit") ?? undefined);
  const csvFile = (csv: string, name: string) =>
    fileResponse(csv, "text/csv; charset=utf-8", { fileName: `${name}-${range.preset}.csv`, download: true });

  if (kind === "ekstre") {
    const accountId = query.get("hesap");
    if (!accountId) return jsonError("Hesap seçimi eksik.", 400);
    const statement = await getAccountStatement(accountId, range.start, range.end);
    if (!statement) return jsonError("Hesap bulunamadı.", 404);
    return csvFile(buildStatementCsv(statement), "hesap-ekstresi");
  }

  const ledger = LEDGERS[kind] ?? LEDGERS.rapor;
  return csvFile(buildLedgerCsv(await ledger.load(range)), ledger.fileName);
}
