import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/db";
import { addDays, startOfDay } from "@/shared/lib/dates";
import { EXPENSE_CATEGORY_LABEL, categoryLabel, type AccountType, type TransactionType } from "@/features/accounting/constants";
import { PAYMENT_METHODS } from "@/features/reservations/constants";

// On muhasebe: kasa/banka hesaplari, gelir-gider defteri, raporlar.
// Para iki tabloda durur: Payment (rezervasyon tahsilati, her zaman gelir) ve
// Transaction (elle girilen gelir/gider). Raporlar ikisini birlikte toplar.

const sum = (rows: { amount: number }[]) => rows.reduce((total, r) => total + r.amount, 0);
const total = (agg: { _sum: { amount: number | null } }) => agg._sum.amount ?? 0;

type Period = { gte?: Date; lt?: Date };

/** Hesap bazinda giris/cikis toplamlari - N hesap icin sabit 3 sorgu. */
async function accountFlows(period?: Period) {
  const [income, expense, payments] = await Promise.all([
    prisma.transaction.groupBy({ by: ["accountId"], where: { type: "GELIR", date: period }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["accountId"], where: { type: "GIDER", date: period }, _sum: { amount: true } }),
    prisma.payment.groupBy({ by: ["accountId"], where: { accountId: { not: null }, paidAt: period }, _sum: { amount: true } }),
  ]);
  const toMap = (rows: { accountId: string | null; _sum: { amount: number | null } }[]) =>
    new Map(rows.map((r) => [r.accountId, r._sum.amount ?? 0]));
  const [incomeMap, expenseMap, paymentMap] = [toMap(income), toMap(expense), toMap(payments)];

  return (accountId: string) => ({
    inflow: (incomeMap.get(accountId) ?? 0) + (paymentMap.get(accountId) ?? 0),
    outflow: expenseMap.get(accountId) ?? 0,
  });
}

/** Her kasa/banka hesabinin acilis bakiyesi + kendine baglanmis tum hareketlerle guncel bakiyesi. */
export async function getAccounts() {
  const [accounts, flowOf] = await Promise.all([prisma.account.findMany({ orderBy: { sort: "asc" } }), accountFlows()]);
  return accounts.map((acc) => {
    const { inflow, outflow } = flowOf(acc.id);
    return { ...acc, balance: acc.openingBalance + inflow - outflow };
  });
}

/** Tarih araliginda her kasa/banka hesabinin giris-cikis ozeti. */
export async function getAccountSummaries(start: Date, end: Date) {
  const [accounts, flowOf] = await Promise.all([
    prisma.account.findMany({ orderBy: { sort: "asc" } }),
    accountFlows({ gte: start, lt: end }),
  ]);
  return accounts.map((acc) => {
    const { inflow, outflow } = flowOf(acc.id);
    return { id: acc.id, name: acc.name, type: acc.type, inflow, outflow, net: inflow - outflow };
  });
}

/** Belirli bir tarih araligindaki toplam gelir/gider (rezervasyon tahsilatlari + manuel kayitlar birlikte). */
export async function getFinanceTotals(start: Date, end: Date) {
  const period = { gte: start, lt: end };
  const [reservationIncome, otherIncome, expense] = await Promise.all([
    prisma.payment.aggregate({ where: { paidAt: period }, _sum: { amount: true } }).then(total),
    prisma.transaction.aggregate({ where: { type: "GELIR", date: period }, _sum: { amount: true } }).then(total),
    prisma.transaction.aggregate({ where: { type: "GIDER", date: period }, _sum: { amount: true } }).then(total),
  ]);
  const income = reservationIncome + otherIncome;
  return { income, expense, profit: income - expense, reservationIncome, otherIncome };
}

/** Tarih araliginda gider kategorisi kirilimi (buyukten kucuge). */
export async function getExpenseByCategory(start: Date, end: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    where: { type: "GIDER", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return rows
    .map((r) => ({ category: r.category, label: EXPENSE_CATEGORY_LABEL[r.category] ?? r.category, amount: r._sum.amount ?? 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Tarih araliginda odeme yontemi kirilimi (nakit / kart / havale), tahsilat + manuel gelir birlikte. */
export async function getIncomeByMethod(start: Date, end: Date) {
  const period = { gte: start, lt: end };
  const [payments, transactions] = await Promise.all([
    prisma.payment.groupBy({ by: ["method"], where: { paidAt: period }, _sum: { amount: true } }),
    prisma.transaction.groupBy({ by: ["method"], where: { type: "GELIR", date: period }, _sum: { amount: true } }),
  ]);

  const totals: Record<string, number> = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.key, 0]));
  for (const row of [...payments, ...transactions]) {
    totals[row.method] = (totals[row.method] ?? 0) + (row._sum.amount ?? 0);
  }
  return totals;
}

/* ---------------------------------------------------------------- */
/* Defter: tahsilat + manuel kayitlarin tek bicimde birlesik listesi. */
/* ---------------------------------------------------------------- */

export type LedgerEntry = {
  id: string;
  date: Date;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  method: string;
  accountName: string;
  source: "REZERVASYON" | "MANUEL";
};

const paymentInclude = { reservation: { include: { guest: true, room: true } }, account: true } satisfies Prisma.PaymentInclude;
type PaymentRow = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;
type TransactionRow = Prisma.TransactionGetPayload<{ include: { account: true } }>;

function paymentTitle(p: { reservation: { guest: { fullName: string }; room: { number: number } } }) {
  return `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`;
}

function paymentToEntry(p: PaymentRow): LedgerEntry {
  return {
    id: `pay-${p.id}`,
    date: p.paidAt,
    type: "GELIR",
    title: paymentTitle(p),
    category: "Konaklama Tahsilatı",
    amount: p.amount,
    method: p.method,
    accountName: p.account?.name ?? "Belirtilmedi",
    source: "REZERVASYON",
  };
}

function transactionToEntry(t: TransactionRow): LedgerEntry {
  return {
    id: `tx-${t.id}`,
    date: t.date,
    type: t.type as TransactionType,
    title: t.title,
    category: categoryLabel(t.type, t.category),
    amount: t.amount,
    method: t.method,
    accountName: t.account.name,
    source: "MANUEL",
  };
}

type LedgerFilter = { payment?: Prisma.PaymentWhereInput; transaction?: Prisma.TransactionWhereInput; limit?: number };

/** Iki tabloyu ayni filtreyle cekip en yeni basta tek listede birlestirir. */
async function fetchLedger({ payment, transaction, limit }: LedgerFilter): Promise<LedgerEntry[]> {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({ where: payment, orderBy: { paidAt: "desc" }, take: limit, include: paymentInclude }),
    prisma.transaction.findMany({ where: transaction, orderBy: { date: "desc" }, take: limit, include: { account: true } }),
  ]);
  const merged = [...payments.map(paymentToEntry), ...transactions.map(transactionToEntry)].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );
  return limit ? merged.slice(0, limit) : merged;
}

/** Rapor/CSV/PDF disa aktarimi icin: tarih araligindaki TUM hareketler. */
export function getLedgerInRange(start: Date, end: Date) {
  const period = { gte: start, lt: end };
  return fetchLedger({ payment: { paidAt: period }, transaction: { date: period } });
}

/** Belirli bir hesap turune (KASA veya BANKA) ait tum hareketler, tarih araliginda. */
export function getAccountTypeLedger(accountType: AccountType, start: Date, end: Date) {
  const period = { gte: start, lt: end };
  const account = { type: accountType };
  return fetchLedger({ payment: { paidAt: period, account }, transaction: { date: period, account } });
}

/** Kredi karti (POS) ile yapilan tum hareketler - tahsilat + manuel kayit birlikte, tarih araliginda. */
export function getCardTransactions(start: Date, end: Date) {
  const period = { gte: start, lt: end };
  return fetchLedger({ payment: { method: "KART", paidAt: period }, transaction: { method: "KART", date: period } });
}

/** Tarihe gore sirali son N hareket. */
export function getRecentLedger(limit = 20) {
  return fetchLedger({ limit });
}

/* ---------------------------------------------------------------- */
/* Hesap ekstresi                                                    */
/* ---------------------------------------------------------------- */

export type StatementRow = {
  id: string;
  date: Date;
  title: string;
  type: TransactionType;
  amount: number;
  method: string;
  balance: number;
};

/** Tek bir hesabin tarih araligindaki hareket ekstresi, yuruyen bakiye ile. */
export async function getAccountStatement(accountId: string, start: Date, end: Date) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return null;

  const before = { lt: start };
  const period = { gte: start, lt: end };

  // Aralik baslangicindan onceki tum hareketlerle devir bakiyesi bulunur.
  const [prevIn, prevOut, prevPay, transactions, payments] = await Promise.all([
    prisma.transaction.aggregate({ where: { accountId, type: "GELIR", date: before }, _sum: { amount: true } }).then(total),
    prisma.transaction.aggregate({ where: { accountId, type: "GIDER", date: before }, _sum: { amount: true } }).then(total),
    prisma.payment.aggregate({ where: { accountId, paidAt: before }, _sum: { amount: true } }).then(total),
    prisma.transaction.findMany({ where: { accountId, date: period } }),
    prisma.payment.findMany({ where: { accountId, paidAt: period }, include: { reservation: { include: { guest: true, room: true } } } }),
  ]);
  const opening = account.openingBalance + prevIn + prevPay - prevOut;

  const movements = [
    ...transactions.map((t) => ({ id: `tx-${t.id}`, date: t.date, title: t.title, type: t.type as TransactionType, amount: t.amount, method: t.method })),
    ...payments.map((p) => ({ id: `pay-${p.id}`, date: p.paidAt, title: paymentTitle(p), type: "GELIR" as const, amount: p.amount, method: p.method })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = opening;
  const rows: StatementRow[] = movements.map((m) => {
    running += m.type === "GELIR" ? m.amount : -m.amount;
    return { ...m, balance: running };
  });

  return { account, opening, rows, closing: running };
}

/* ---------------------------------------------------------------- */
/* Zaman serileri                                                    */
/* ---------------------------------------------------------------- */

/** Son N ayin gelir/gider/kar-zarar dokumu (en yeni ay basta). Ay sayisindan bagimsiz sabit 3 sorgu. */
export async function getMonthlyProfitLoss(monthsBack = 12) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { start, end, label: start.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) };
  });

  const range = { gte: months[months.length - 1].start, lt: months[0].end };
  const [payments, incomeTx, expenseTx] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: range }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({ where: { type: "GELIR", date: range }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "GIDER", date: range }, select: { amount: true, date: true } }),
  ]);

  return months.map(({ start, end, label }) => {
    const within = (d: Date) => d >= start && d < end;
    const reservationIncome = sum(payments.filter((p) => within(p.paidAt)));
    const otherIncome = sum(incomeTx.filter((t) => within(t.date)));
    const expense = sum(expenseTx.filter((t) => within(t.date)));
    const income = reservationIncome + otherIncome;
    return { label, year: start.getFullYear(), month: start.getMonth(), income, expense, profit: income - expense, reservationIncome, otherIncome };
  });
}

/** Son N gunun gunluk toplam gelir grafigi icin (rezervasyon tahsilati + manuel gelir). */
export async function getDailyRevenue(days = 14) {
  const start = addDays(startOfDay(new Date()), -(days - 1));

  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: { gte: start } }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({ where: { type: "GELIR", date: { gte: start } }, select: { amount: true, date: true } }),
  ]);

  const byDay = new Map(Array.from({ length: days }, (_, i) => [addDays(start, i).getTime(), 0]));
  const add = (day: Date, amount: number) => {
    const key = startOfDay(day).getTime();
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + amount);
  };
  for (const p of payments) add(p.paidAt, p.amount);
  for (const t of transactions) add(t.date, t.amount);

  return Array.from(byDay, ([time, amount]) => ({
    label: new Date(time).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
    amount,
  }));
}
