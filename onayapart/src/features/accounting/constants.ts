// On muhasebe kategori ve hesap turu sabitleri. Saf veri.

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  PERSONEL: "Personel Maaşı",
  FATURA: "Fatura",
  KIRA: "Kira",
  BAKIM: "Bakım - Onarım",
  MALZEME: "Envanter / Stok Alımı",
  VERGI: "Vergi / SGK",
  DIGER: "Diğer Gider",
};

export const INCOME_CATEGORY_LABEL: Record<string, string> = {
  KONAKLAMA_DISI: "Konaklama Dışı Gelir",
  DIGER: "Diğer Gelir",
};

const toOptions = (labels: Record<string, string>) => Object.entries(labels).map(([key, label]) => ({ key, label }));

export const expenseCategories = toOptions(EXPENSE_CATEGORY_LABEL);
export const incomeCategories = toOptions(INCOME_CATEGORY_LABEL);

export type TransactionType = "GELIR" | "GIDER";

/** "DIGER" hem gelirde hem giderde gecer; dogru etiket icin tur bilgisiyle birlikte cozulur. */
export function categoryLabel(type: string, category: string): string {
  const labels = type === "GELIR" ? INCOME_CATEGORY_LABEL : EXPENSE_CATEGORY_LABEL;
  return labels[category] ?? category;
}

export function isValidCategory(type: string, category: string): boolean {
  return category in (type === "GELIR" ? INCOME_CATEGORY_LABEL : EXPENSE_CATEGORY_LABEL);
}

export const ACCOUNT_TYPE_LABEL: Record<string, string> = { KASA: "Kasa", BANKA: "Banka / POS" };
export type AccountType = "KASA" | "BANKA";

/** Stok alimi gideri; secildiginde islem formu stok girisini de isler. */
export const INVENTORY_PURCHASE_CATEGORY = "MALZEME";
