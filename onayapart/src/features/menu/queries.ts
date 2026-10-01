import { prisma } from "@/shared/lib/db";

/** Restoran menusu: kategoriler + urunler (sadece menude gorunur olanlar), gunun menusu ayrica. */
export async function getMenu() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: "asc" },
    include: { items: { where: { isAvailable: true }, orderBy: { sort: "asc" } } },
  });
  const dailySpecials = categories.flatMap((c) => c.items.filter((i) => i.isDailySpecial));
  return { categories: categories.filter((c) => c.items.length > 0), dailySpecials };
}
