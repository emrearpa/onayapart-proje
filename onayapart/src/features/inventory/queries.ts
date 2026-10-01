import { prisma } from "@/shared/lib/db";

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
