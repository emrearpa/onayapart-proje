import { prisma } from "@/lib/db";
import { startOfDay, addDays, addMonths, overlaps, dayDiff } from "@/lib/dates";
import { cache } from "react";

/** Panelden duzenlenen iletisim/tanitim bilgileri. Ayni istek icinde birden fazla bilesen
 *  cagirsa bile tek DB sorgusuna iner (React cache). */
export const getSiteSettings = cache(async () => {
  const existing = await prisma.siteSetting.findUnique({ where: { id: "main" } });
  if (existing) return existing;

  // Guvenlik agi: satir hic olusturulmamissa varsayilanlarla olusturur.
  return prisma.siteSetting.create({
    data: {
      id: "main",
      phoneDisplay: "0530 652 70 88",
      phoneHref: "+905306527088",
      whatsapp: "905306527088",
      addressStreet: "Muratpaşa Mah. Saraybosna Cad. Sabunhane Sk. No: 13",
      addressDistrict: "Yakutiye",
      addressCity: "Erzurum",
      addressPostalCode: "25000",
      heroEyebrow: "Erzurum'un merkezinde apart konaklama",
      heroTitle: "Erzurum apart daire arayanların ilk tercihi: Onay Apart Rezidans",
      heroIntro:
        "Yakutiye Muratpaşa'da, şehir merkezine yürüme mesafesinde tam donanımlı 1+0, 1+1 ve 2+1 apart daireler.",
    },
  });
});

export async function getAmenities() {
  return prisma.amenity.findMany({ orderBy: { sort: "asc" } });
}

export async function getFaqs(homepageOnly = false) {
  return prisma.faq.findMany({
    where: homepageOnly ? { homepage: true } : undefined,
    orderBy: { sort: "asc" },
  });
}

/** Sitede gosterilecek, personelin elle sectigi gercek musteri yorumlari. */
export async function getTestimonials() {
  return prisma.testimonial.findMany({ where: { isPublished: true }, orderBy: { sort: "asc" } });
}

/** Restoran menusu: kategoriler + urunler (sadece menude gorunur olanlar), gunun menusu ayrica. */
export async function getMenu() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: "asc" },
    include: { items: { where: { isAvailable: true }, orderBy: { sort: "asc" } } },
  });
  const dailySpecials = categories.flatMap((c) => c.items.filter((i) => i.isDailySpecial));
  return { categories: categories.filter((c) => c.items.length > 0), dailySpecials };
}

/* ---------------------------------------------------------------- */
/* On muhasebe: kasa/banka hesaplari, gelir-gider defteri, raporlar. */
/* ---------------------------------------------------------------- */

const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  PERSONEL: "Personel Maaşı",
  FATURA: "Fatura",
  KIRA: "Kira",
  BAKIM: "Bakım - Onarım",
  MALZEME: "Envanter / Stok Alımı",
  VERGI: "Vergi / SGK",
  DIGER: "Diğer Gider",
};
const INCOME_CATEGORY_LABEL: Record<string, string> = {
  KONAKLAMA_DISI: "Konaklama Dışı Gelir",
  DIGER: "Diğer Gelir",
};
export const financeCategoryLabel: Record<string, string> = { ...EXPENSE_CATEGORY_LABEL, ...INCOME_CATEGORY_LABEL };
export const expenseCategories = Object.entries(EXPENSE_CATEGORY_LABEL).map(([key, label]) => ({ key, label }));
export const incomeCategories = Object.entries(INCOME_CATEGORY_LABEL).map(([key, label]) => ({ key, label }));

/** "DIGER" gibi hem gelir hem giderde kullanilan ortak anahtarlar dogru etikete
 *  cozulsun diye tur (GELIR/GIDER) bilgisiyle birlikte bakar. */
function categoryLabel(type: string, category: string): string {
  const dict = type === "GELIR" ? INCOME_CATEGORY_LABEL : EXPENSE_CATEGORY_LABEL;
  return dict[category] ?? category;
}

/** Her kasa/banka hesabinin acilis bakiyesi + kendine baglanmis tum hareketlerle guncel bakiyesi. */
export async function getAccounts() {
  const accounts = await prisma.account.findMany({ orderBy: { sort: "asc" } });
  const accountIds = accounts.map((a) => a.id);

  // Her hesap icin ayri ayri toplam sormak yerine, hepsini TEK groupBy sorgusuyla
  // aliyoruz - N hesap icin 3N degil, sabit 3 sorgu.
  const [incomeSums, expenseSums, paymentSums] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, type: "GELIR" },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, type: "GIDER" },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds } },
      _sum: { amount: true },
    }),
  ]);

  const incomeMap = new Map<string, number>(incomeSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));
  const expenseMap = new Map<string, number>(expenseSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));
  const paymentMap = new Map<string, number>(paymentSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));

  return accounts.map((acc) => {
    const balance =
      acc.openingBalance + (incomeMap.get(acc.id) ?? 0) - (expenseMap.get(acc.id) ?? 0) + (paymentMap.get(acc.id) ?? 0);
    return { ...acc, balance };
  });
}

/** Belirli bir tarih araligindaki toplam gelir/gider (rezervasyon tahsilatlari + manuel kayitlar birlikte). */
export async function getFinanceTotals(start: Date, end: Date) {
  const [reservationIncome, manualIncome, manualExpense] = await Promise.all([
    prisma.payment.aggregate({ where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "GELIR", date: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "GIDER", date: { gte: start, lt: end } }, _sum: { amount: true } }),
  ]);
  const income = (reservationIncome._sum.amount ?? 0) + (manualIncome._sum.amount ?? 0);
  const expense = manualExpense._sum.amount ?? 0;
  return {
    income,
    expense,
    profit: income - expense,
    reservationIncome: reservationIncome._sum.amount ?? 0,
    otherIncome: manualIncome._sum.amount ?? 0,
  };
}

/** Tarih araliginda gider kategorisi kirilimi (buyukten kucuge). */
export async function getExpenseByCategory(start: Date, end: Date) {
  const rows = await prisma.transaction.groupBy({
    by: ["category"],
    where: { type: "GIDER", date: { gte: start, lt: end } },
    _sum: { amount: true },
  });
  return rows
    .map((r: { category: string; _sum: { amount: number | null } }) => ({
      category: r.category,
      label: EXPENSE_CATEGORY_LABEL[r.category] ?? r.category,
      amount: r._sum.amount ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/** Tarih araliginda odeme yontemi kirilimi (nakit / kart / havale), tahsilat + manuel gelir birlikte. */
export async function getIncomeByMethod(start: Date, end: Date) {
  const [payments, transactions] = await Promise.all([
    prisma.payment.groupBy({
      by: ["method"],
      where: { paidAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["method"],
      where: { type: "GELIR", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const totals: Record<string, number> = { NAKIT: 0, KART: 0, HAVALE: 0 };
  for (const p of payments as { method: string; _sum: { amount: number | null } }[]) {
    totals[p.method] = (totals[p.method] ?? 0) + (p._sum.amount ?? 0);
  }
  for (const t of transactions as { method: string; _sum: { amount: number | null } }[]) {
    totals[t.method] = (totals[t.method] ?? 0) + (t._sum.amount ?? 0);
  }
  return totals;
}

/** Tarih araliginda her kasa/banka hesabinin giris-cikis ozeti. */
export async function getAccountSummaries(start: Date, end: Date) {
  const accounts = await prisma.account.findMany({ orderBy: { sort: "asc" } });
  const accountIds = accounts.map((a) => a.id);

  const [incomeSums, expenseSums, paymentSums] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, type: "GELIR", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, type: "GIDER", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
    prisma.payment.groupBy({
      by: ["accountId"],
      where: { accountId: { in: accountIds }, paidAt: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const incomeMap = new Map<string, number>(incomeSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));
  const expenseMap = new Map<string, number>(expenseSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));
  const paymentMap = new Map<string, number>(paymentSums.map((r) => [r.accountId as string, r._sum.amount ?? 0]));

  return accounts.map((acc) => {
    const inflow = (incomeMap.get(acc.id) ?? 0) + (paymentMap.get(acc.id) ?? 0);
    const outflow = expenseMap.get(acc.id) ?? 0;
    return { id: acc.id, name: acc.name, type: acc.type, inflow, outflow, net: inflow - outflow };
  });
}

export type StatementRow = {
  id: string;
  date: Date;
  title: string;
  type: "GELIR" | "GIDER";
  amount: number;
  method: string;
  balance: number;
};

/** Tek bir hesabin tarih araligindaki hareket ekstresi, yurüyen bakiye ile. */
export async function getAccountStatement(accountId: string, start: Date, end: Date) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return null;

  // Aralik baslangicindan onceki tum hareketlerle devir bakiyesi bulunur.
  const [prevIn, prevOut, prevPay] = await Promise.all([
    prisma.transaction.aggregate({
      where: { accountId, type: "GELIR", date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { accountId, type: "GIDER", date: { lt: start } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({ where: { accountId, paidAt: { lt: start } }, _sum: { amount: true } }),
  ]);
  const opening =
    account.openingBalance + (prevIn._sum.amount ?? 0) + (prevPay._sum.amount ?? 0) - (prevOut._sum.amount ?? 0);

  const [transactions, payments] = await Promise.all([
    prisma.transaction.findMany({ where: { accountId, date: { gte: start, lt: end } }, orderBy: { date: "asc" } }),
    prisma.payment.findMany({
      where: { accountId, paidAt: { gte: start, lt: end } },
      orderBy: { paidAt: "asc" },
      include: { reservation: { include: { guest: true, room: true } } },
    }),
  ]);

  const merged = [
    ...transactions.map((t) => ({
      id: `tx-${t.id}`,
      date: t.date,
      title: t.title,
      type: t.type as "GELIR" | "GIDER",
      amount: t.amount,
      method: t.method,
    })),
    ...payments.map((p) => ({
      id: `pay-${p.id}`,
      date: p.paidAt,
      title: `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`,
      type: "GELIR" as const,
      amount: p.amount,
      method: p.method,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = opening;
  const rows: StatementRow[] = merged.map((m) => {
    running += m.type === "GELIR" ? m.amount : -m.amount;
    return { ...m, balance: running };
  });

  return { account, opening, rows, closing: running };
}

/** Kredi karti ile tahsil edilen tutar (rezervasyon tahsilati + manuel gelir), tarih araliginda. */
export async function getCardCollections(start: Date, end: Date) {
  const [reservationCard, manualCard] = await Promise.all([
    prisma.payment.aggregate({ where: { method: "KART", paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({
      where: { type: "GELIR", method: "KART", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);
  return (reservationCard._sum.amount ?? 0) + (manualCard._sum.amount ?? 0);
}

/** Son N ayin gelir/gider/kar-zarar dokumu (en yeni ay basta). */
export async function getMonthlyProfitLoss(monthsBack = 12) {
  const now = new Date();
  const months: { year: number; month: number; label: string; start: Date; end: Date }[] = [];
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
      start,
      end,
    });
  }

  const rangeStart = months[months.length - 1].start;
  const rangeEnd = months[0].end;

  // Tum ay araligini TEK seferde cekip JS icinde ay ay topluyoruz - N ay icin
  // N kat degil, sabit 3 sorgu (monthsBack ne olursa olsun).
  const [payments, incomeTx, expenseTx] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: { gte: rangeStart, lt: rangeEnd } }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({ where: { type: "GELIR", date: { gte: rangeStart, lt: rangeEnd } }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "GIDER", date: { gte: rangeStart, lt: rangeEnd } }, select: { amount: true, date: true } }),
  ]);

  return months.map((m) => {
    const reservationIncome = payments
      .filter((p) => p.paidAt >= m.start && p.paidAt < m.end)
      .reduce((s, p) => s + p.amount, 0);
    const otherIncome = incomeTx
      .filter((t) => t.date >= m.start && t.date < m.end)
      .reduce((s, t) => s + t.amount, 0);
    const expense = expenseTx
      .filter((t) => t.date >= m.start && t.date < m.end)
      .reduce((s, t) => s + t.amount, 0);
    const income = reservationIncome + otherIncome;
    return {
      label: m.label,
      year: m.year,
      month: m.month,
      income,
      expense,
      profit: income - expense,
      reservationIncome,
      otherIncome,
    };
  });
}

/** Son N gunun gunluk toplam gelir grafigi icin (rezervasyon tahsilati + manuel gelir). */
export async function getDailyRevenue(days = 14) {
  const today = startOfDay(new Date());
  const start = addDays(today, -(days - 1));

  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({ where: { paidAt: { gte: start } }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({
      where: { type: "GELIR", date: { gte: start } },
      select: { amount: true, date: true },
    }),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = addDays(start, i);
    byDay.set(d.toDateString(), 0);
  }
  for (const p of payments) {
    const key = startOfDay(p.paidAt).toDateString();
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + p.amount);
  }
  for (const t of transactions as { amount: number; date: Date }[]) {
    const key = startOfDay(t.date).toDateString();
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + t.amount);
  }

  return Array.from(byDay.entries()).map(([key, amount]) => ({
    label: new Date(key).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
    amount,
  }));
}

/** Her stok kaleminin konum bazli (Depo, Kat Hizmetleri vb.) miktarlarini birlikte dondurur. */
export async function getInventoryItemsWithStock() {
  const [items, locations] = await Promise.all([
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" }, include: { stocks: true } }),
    prisma.inventoryLocation.findMany({ orderBy: { sort: "asc" } }),
  ]);

  const withStock = items.map((item) => {
    const byLocation = Object.fromEntries(
      locations.map((l) => [l.id, item.stocks.find((s) => s.locationId === l.id)?.quantity ?? 0])
    );
    const total = Object.values(byLocation).reduce((s, v) => s + v, 0);
    return { ...item, byLocation, total };
  });

  return { items: withStock, locations };
}

export type LedgerEntry = {
  id: string;
  date: Date;
  type: "GELIR" | "GIDER";
  title: string;
  category: string;
  amount: number;
  method: string;
  accountName: string;
  source: "REZERVASYON" | "MANUEL";
};

/** Belirli bir hesap turune (KASA veya BANKA) ait tum hareketler, tarih araliginda. */
export async function getAccountTypeLedger(accountType: "KASA" | "BANKA", start: Date, end: Date): Promise<LedgerEntry[]> {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: start, lt: end }, account: { type: accountType } },
      orderBy: { paidAt: "desc" },
      include: { reservation: { include: { guest: true, room: true } }, account: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end }, account: { type: accountType } },
      orderBy: { date: "desc" },
      include: { account: true },
    }),
  ]);

  const fromPayments: LedgerEntry[] = payments.map((p) => ({
    id: `pay-${p.id}`,
    date: p.paidAt,
    type: "GELIR",
    title: `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`,
    category: "Konaklama Tahsilatı",
    amount: p.amount,
    method: p.method,
    accountName: p.account?.name ?? "Belirtilmedi",
    source: "REZERVASYON",
  }));

  const fromTransactions: LedgerEntry[] = transactions.map((t) => ({
    id: `tx-${t.id}`,
    date: t.date,
    type: t.type as "GELIR" | "GIDER",
    title: t.title,
    category: categoryLabel(t.type, t.category),
    amount: t.amount,
    method: t.method,
    accountName: t.account.name,
    source: "MANUEL",
  }));

  return [...fromPayments, ...fromTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Rapor/CSV/PDF disa aktarimi icin: tarih araligindaki TUM hareketler, limitsiz. */
export async function getLedgerInRange(start: Date, end: Date): Promise<LedgerEntry[]> {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({
      where: { paidAt: { gte: start, lt: end } },
      orderBy: { paidAt: "desc" },
      include: { reservation: { include: { guest: true, room: true } }, account: true },
    }),
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      include: { account: true },
    }),
  ]);

  const fromPayments: LedgerEntry[] = payments.map((p) => ({
    id: `pay-${p.id}`,
    date: p.paidAt,
    type: "GELIR",
    title: `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`,
    category: "Konaklama Tahsilatı",
    amount: p.amount,
    method: p.method,
    accountName: p.account?.name ?? "Belirtilmedi",
    source: "REZERVASYON",
  }));

  const fromTransactions: LedgerEntry[] = transactions.map((t) => ({
    id: `tx-${t.id}`,
    date: t.date,
    type: t.type as "GELIR" | "GIDER",
    title: t.title,
    category: categoryLabel(t.type, t.category),
    amount: t.amount,
    method: t.method,
    accountName: t.account.name,
    source: "MANUEL",
  }));

  return [...fromPayments, ...fromTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Kredi karti (POS) ile yapilan tum hareketler - rezervasyon tahsilati + manuel kayit birlikte, tarih araliginda. */
export async function getCardTransactions(start: Date, end: Date): Promise<LedgerEntry[]> {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({
      where: { method: "KART", paidAt: { gte: start, lt: end } },
      orderBy: { paidAt: "desc" },
      include: { reservation: { include: { guest: true, room: true } }, account: true },
    }),
    prisma.transaction.findMany({
      where: { method: "KART", date: { gte: start, lt: end } },
      orderBy: { date: "desc" },
      include: { account: true },
    }),
  ]);

  const fromPayments: LedgerEntry[] = payments.map((p) => ({
    id: `pay-${p.id}`,
    date: p.paidAt,
    type: "GELIR",
    title: `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`,
    category: "Konaklama Tahsilatı",
    amount: p.amount,
    method: p.method,
    accountName: p.account?.name ?? "Belirtilmedi",
    source: "REZERVASYON",
  }));

  const fromTransactions: LedgerEntry[] = transactions.map((t) => ({
    id: `tx-${t.id}`,
    date: t.date,
    type: t.type as "GELIR" | "GIDER",
    title: t.title,
    category: categoryLabel(t.type, t.category),
    amount: t.amount,
    method: t.method,
    accountName: t.account.name,
    source: "MANUEL",
  }));

  return [...fromPayments, ...fromTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
}

/** Rezervasyon tahsilatlari + manuel gelir/gider kayitlarinin birlikte, tarihe gore sirali son N hareketi. */
export async function getRecentLedger(limit = 20): Promise<LedgerEntry[]> {
  const [payments, transactions] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: limit,
      include: { reservation: { include: { guest: true, room: true } }, account: true },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: limit,
      include: { account: true },
    }),
  ]);

  const fromPayments: LedgerEntry[] = payments.map((p) => ({
    id: `pay-${p.id}`,
    date: p.paidAt,
    type: "GELIR",
    title: `${p.reservation.guest.fullName} — Oda ${p.reservation.room.number} tahsilatı`,
    category: "Konaklama Tahsilatı",
    amount: p.amount,
    method: p.method,
    accountName: p.account?.name ?? "Belirtilmedi",
    source: "REZERVASYON",
  }));

  const fromTransactions: LedgerEntry[] = transactions.map((t) => ({
    id: `tx-${t.id}`,
    date: t.date,
    type: t.type as "GELIR" | "GIDER",
    title: t.title,
    category: categoryLabel(t.type, t.category),
    amount: t.amount,
    method: t.method,
    accountName: t.account.name,
    source: "MANUEL",
  }));

  return [...fromPayments, ...fromTransactions].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}

export type UpcomingPayment = {
  guest: { id: string; fullName: string; phone: string };
  room: { number: number };
  reservation: { id: string; code: string; stayType: string };
  dueDate: Date;
  amount: number;
};

/** Aylik/donemlik/kurumsal konaklamalarda, giris gunune denk gelen aylik odeme
 *  tarihi yaklasan ya da gecmis olup hala bakiyesi olan musterileri bulur.
 *  Yillik konaklamalarda toplam bedel 12'ye bolunur; giris gunune denk gelen
 *  her ay icin bir taksit "vadesi gelmis" sayilir ve birikmis eksik odeme uyarilir. */
export async function getUpcomingPayments(daysAhead = 5): Promise<UpcomingPayment[]> {
  const today = startOfDay(new Date());

  const reservations = await prisma.reservation.findMany({
    where: {
      status: { in: ["ONAYLI", "GIRIS_YAPTI"] },
      stayType: { in: ["AYLIK", "DONEMLIK", "KURUMSAL", "YILLIK"] },
      checkIn: { lte: today },
    },
    include: { guest: true, room: true, payments: true },
  });

  const results: UpcomingPayment[] = [];
  for (const r of reservations) {
    const paid = r.payments.reduce((s: number, p: { amount: number }) => s + p.amount, 0);

    if (r.stayType === "YILLIK") {
      const monthlyAmount = r.totalAmount / 12;
      // checkIn gunune denk gelen kacinci ayin odeme tarihi bugune ulasti/gecti?
      let n = 0;
      while (addMonths(r.checkIn, n) <= today) n++;
      if (n === 0) continue; // giris gunu henuz gelmedi (bu durumda zaten sorguya girmez ama guvenlik icin)

      const dueDate = addMonths(r.checkIn, n - 1); // en son vadesi gelen taksitin tarihi
      const expectedSoFar = Math.min(r.totalAmount, monthlyAmount * n);
      const owedNow = expectedSoFar - paid;
      if (owedNow <= 0) continue;

      results.push({
        guest: { id: r.guest.id, fullName: r.guest.fullName, phone: r.guest.phone },
        room: { number: r.room.number },
        reservation: { id: r.id, code: r.code, stayType: r.stayType },
        dueDate,
        amount: owedNow,
      });
      continue;
    }

    const paidBalance = r.totalAmount - paid;
    if (paidBalance <= 0) continue;

    const day = r.checkIn.getDate();
    const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), day);
    const diff = dayDiff(today, dueThisMonth); // gecmisse negatif, yaklasansa 0..daysAhead

    if (diff <= daysAhead) {
      results.push({
        guest: { id: r.guest.id, fullName: r.guest.fullName, phone: r.guest.phone },
        room: { number: r.room.number },
        reservation: { id: r.id, code: r.code, stayType: r.stayType },
        dueDate: dueThisMonth,
        amount: paidBalance,
      });
    }
  }

  return results.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/** Bugun aylik odeme gunu gelmis (veya gecmis) ve hala borcu olan musteriler; otomatik
 *  WhatsApp hatirlatmasi icin kullanilir. periodKey ile ayni ay ikinci kez gonderim engellenir. */
export async function getRemindableCustomers() {
  const upcoming = await getUpcomingPayments(0); // sadece gunu gelmis/gecmis olanlar
  const today = startOfDay(new Date());
  const periodKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const alreadySent = await prisma.messageLog.findMany({
    where: { kind: "ODEME_HATIRLATMA", periodKey, status: { in: ["GONDERILDI", "LINK_HAZIRLANDI"] } },
    select: { reservationId: true },
  });
  const sentIds = new Set(alreadySent.map((m: { reservationId: string | null }) => m.reservationId));

  return {
    periodKey,
    items: upcoming.map((u) => ({ ...u, alreadyNotified: sentIds.has(u.reservation.id) })),
  };
}

export type Availability = "MUSAIT" | "DOLU" | "HARICI" | "TEMIZLIK" | "BAKIM";

export const availabilityLabel: Record<Availability, string> = {
  MUSAIT: "Müsait",
  DOLU: "Dolu",
  HARICI: "Dolu (Booking/Airbnb)",
  TEMIZLIK: "Hazırlanıyor",
  BAKIM: "Bakımda",
};

const ACTIVE = ["OPSIYON", "ONAYLI", "GIRIS_YAPTI"];

/** Bir dairenin bugünkü durumu: rezervasyon > harici (Booking/Airbnb) > bakım/temizlik > müsait */
export function availabilityOf(
  condition: string,
  reservations: { checkIn: Date; checkOut: Date; status: string }[],
  day = new Date(),
  externalBookings: { checkIn: Date; checkOut: Date }[] = []
): Availability {
  const today = startOfDay(day);
  const busy = reservations.some(
    (r) => ACTIVE.includes(r.status) && overlaps(r.checkIn, r.checkOut, today, addDays(today, 1))
  );
  if (busy) return "DOLU";
  const externalBusy = externalBookings.some((e) => overlaps(e.checkIn, e.checkOut, today, addDays(today, 1)));
  if (externalBusy) return "HARICI";
  if (condition === "BAKIM") return "BAKIM";
  if (condition === "TEMIZLIK") return "TEMIZLIK";
  return "MUSAIT";
}

export async function getRoomTypes() {
  return prisma.roomType.findMany({
    orderBy: { sort: "asc" },
    include: {
      rates: { orderBy: { sort: "asc" } },
      rooms: {
        where: { isPublished: true },
        select: {
          condition: true,
          reservations: { select: { checkIn: true, checkOut: true, status: true } },
          externalBookings: { select: { checkIn: true, checkOut: true } },
        },
      },
    },
  });
}

export async function getRoomType(slug: string) {
  return prisma.roomType.findUnique({
    where: { slug },
    include: { rates: { orderBy: { sort: "asc" } } },
  });
}

export async function getRooms(typeSlug?: string) {
  return prisma.room.findMany({
    where: { isPublished: true, ...(typeSlug ? { type: { slug: typeSlug } } : {}) },
    orderBy: { number: "asc" },
    include: {
      type: true,
      photos: { orderBy: { sort: "asc" }, take: 1 },
      reservations: { select: { checkIn: true, checkOut: true, status: true } },
      externalBookings: { select: { checkIn: true, checkOut: true } },
    },
  });
}

export async function getRoom(number: number) {
  return prisma.room.findUnique({
    where: { number },
    include: {
      type: { include: { rates: { orderBy: { sort: "asc" } } } },
      photos: { orderBy: { sort: "asc" } },
      reservations: { select: { checkIn: true, checkOut: true, status: true } },
      externalBookings: { select: { checkIn: true, checkOut: true } },
    },
  });
}

export async function getPublishedRoomNumbers() {
  return prisma.room.findMany({ where: { isPublished: true }, select: { number: true, type: { select: { slug: true } } } });
}

/** ERP gösterge paneli özeti */
export async function getDashboard(days = 14) {
  const today = startOfDay(new Date());
  const until = addDays(today, days);

  const [rooms, reservations, externalBookings, leads, openTasks, payments] = await Promise.all([
    prisma.room.findMany({ orderBy: { number: "asc" }, include: { type: true } }),
    prisma.reservation.findMany({
      where: { status: { in: ACTIVE }, checkOut: { gte: today }, checkIn: { lt: until } },
      include: { guest: true, room: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.externalBooking.findMany({
      where: { checkOut: { gte: today }, checkIn: { lt: until } },
    }),
    prisma.lead.findMany({ where: { handled: false }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.task.findMany({ where: { status: "ACIK" }, include: { room: true, guest: true }, orderBy: { createdAt: "asc" } }),
    prisma.payment.findMany({ where: { paidAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } } }),
  ]);

  const occupiedToday = rooms.filter(
    (r) =>
      reservations.some((v) => v.roomId === r.id && overlaps(v.checkIn, v.checkOut, today, addDays(today, 1))) ||
      externalBookings.some((v) => v.roomId === r.id && overlaps(v.checkIn, v.checkOut, today, addDays(today, 1)))
  ).length;

  const arrivals = reservations.filter((r) => startOfDay(r.checkIn).getTime() === today.getTime());
  const departures = reservations.filter((r) => startOfDay(r.checkOut).getTime() === today.getTime());
  const monthRevenue = payments.reduce((s, p) => s + p.amount, 0);

  const allActive = await prisma.reservation.findMany({
    where: { status: { in: ACTIVE } },
    include: { payments: true },
  });
  const receivable = allActive.reduce(
    (s, r) => s + Math.max(0, r.totalAmount - r.payments.reduce((a, p) => a + p.amount, 0)),
    0
  );
  const pendingKbs = allActive.filter((r) => !r.kbsReported && startOfDay(r.checkIn) <= today).length;

  return {
    today,
    days,
    rooms,
    reservations,
    externalBookings,
    leads,
    openTasks,
    kpi: {
      occupancy: rooms.length ? Math.round((occupiedToday / rooms.length) * 100) : 0,
      occupiedToday,
      totalRooms: rooms.length,
      arrivals: arrivals.length,
      departures: departures.length,
      monthRevenue,
      receivable,
      pendingKbs,
    },
  };
}

/** Takvim şeridi: her oda için gün gün durum */
export function buildCalendar(
  rooms: { id: string; number: number; condition: string; type: { code: string } }[],
  reservations: { id: string; roomId: string; checkIn: Date; checkOut: Date; guest: { fullName: string } }[],
  start: Date,
  days: number,
  externalBookings: { roomId: string; checkIn: Date; checkOut: Date; platform: string }[] = []
) {
  return rooms.map((room) => ({
    room,
    cells: Array.from({ length: days }, (_, i) => {
      const d = addDays(start, i);
      const res = reservations.find(
        (r) => r.roomId === room.id && overlaps(r.checkIn, r.checkOut, d, addDays(d, 1))
      );
      const ext = !res
        ? externalBookings.find((e) => e.roomId === room.id && overlaps(e.checkIn, e.checkOut, d, addDays(d, 1)))
        : undefined;

      let state: "DOLU" | "HARICI" | "BAKIM" | "TEMIZLIK" | "BOS" = "BOS";
      if (res) state = "DOLU";
      else if (ext) state = "HARICI";
      else if (room.condition === "BAKIM") state = "BAKIM";
      else if (room.condition === "TEMIZLIK") state = "TEMIZLIK";

      return {
        date: d,
        state,
        guest: res?.guest.fullName ?? (ext ? ext.platform : null),
        reservationId: res?.id ?? null,
        isStart: res
          ? startOfDay(res.checkIn).getTime() === d.getTime()
          : ext
            ? startOfDay(ext.checkIn).getTime() === d.getTime()
            : false,
      };
    }),
  }));
}
