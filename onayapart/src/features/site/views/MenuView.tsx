import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { fmtMoney } from "@/shared/lib/dates";
import { site } from "@/shared/lib/site";
import { localize } from "@/features/content/localized";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import { getMenu } from "@/features/menu/queries";
import SiteShell from "@/features/site/components/SiteShell";

const PATH = "/menu";

type Item = { id: string; name: string; description: string | null; price: number };

export async function menuMetadata(locale?: Locale): Promise<Metadata> {
  const t = getDictionary(locale);
  return { title: `${t.nav.menu} — ${site.name}`, description: t.ui.menuIntro, alternates: await pageAlternates(PATH, locale) };
}

function MenuItems({ items, className }: { items: Item[]; className: string }) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start justify-between gap-4 py-4">
          <div>
            <div className="font-semibold">{item.name}</div>
            {item.description && <p className="mt-1 text-sm text-ink-soft">{item.description}</p>}
          </div>
          <div className="shrink-0 font-extrabold">{fmtMoney(item.price)}</div>
        </li>
      ))}
    </ul>
  );
}

export default async function MenuView({ locale }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const [menu, settings] = await Promise.all([getMenu(), getSiteSettings()]);
  // Restoran bolumu panelden kapatilmissa sayfa yayinda degildir.
  if (!settings.menuEnabled) notFound();

  const [categories, dailySpecials] = await Promise.all([
    localize("MenuCategory", menu.categories, ["name"], locale).then((cats) =>
      Promise.all(cats.map(async (cat) => ({ ...cat, items: await localize("MenuItem", cat.items, ["name", "description"], locale) })))
    ),
    localize("MenuItem", menu.dailySpecials, ["name", "description"], locale),
  ]);

  return (
    <SiteShell locale={locale}>
      <main className="container-page py-14">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.nav.menu}</h1>
          <p className="lede mt-3">{t.ui.menuIntro}</p>

          {dailySpecials.length > 0 && (
            <section className="mt-8 overflow-hidden rounded-2xl border border-gold-200 bg-gold-50/60">
              <h2 className="bg-gold-500 px-5 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white">{t.home.dailySpecial}</h2>
              <MenuItems items={dailySpecials} className="divide-y divide-gold-200 px-5" />
            </section>
          )}

          {categories.length === 0 ? (
            <p className="mt-8 text-sm text-ink-soft">{t.ui.menuComingSoon}</p>
          ) : (
            <div className="mt-10 space-y-8">
              {categories.map((category) => (
                <section key={category.id}>
                  <h2 className="text-xl font-extrabold tracking-tight text-brand-700">{category.name}</h2>
                  <MenuItems items={category.items} className="mt-3 divide-y divide-line rounded-2xl border border-line px-4" />
                </section>
              ))}
            </div>
          )}

          <p className="mt-10 text-sm text-ink-soft">
            {t.ui.orderCall}{" "}
            <a href={`tel:${settings.phoneHref}`} className="font-bold text-brand-600">
              {settings.phoneDisplay}
            </a>
          </p>
        </div>
      </main>
    </SiteShell>
  );
}
