import type { Metadata } from "next";
import type { Locale } from "@/shared/i18n/config";
import { getDictionary } from "@/shared/i18n/dictionaries";
import { fullAddress, mapsLink, site, waLink } from "@/shared/lib/site";
import { getSiteSettings } from "@/features/content/queries";
import { pageAlternates } from "@/features/content/seo";
import LeadForm from "@/features/leads/components/LeadForm";
import LocationMap from "@/features/site/components/LocationMap";
import SiteShell from "@/features/site/components/SiteShell";

const PATH = "/iletisim";

export async function contactMetadata(locale?: Locale): Promise<Metadata> {
  const t = getDictionary(locale);
  return { title: `${t.nav.contact} — ${site.name}`, description: t.ui.contactIntro, alternates: await pageAlternates(PATH, locale) };
}

export default async function ContactView({ locale }: { locale?: Locale }) {
  const t = getDictionary(locale);
  const settings = await getSiteSettings();

  return (
    <SiteShell locale={locale}>
      <main className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.nav.contact}</h1>
          <p className="lede mt-3 max-w-[60ch]">{t.ui.contactIntro}</p>

          <dl className="mt-8 space-y-5 text-sm">
            <div>
              <dt className="font-bold">{t.common.phone}</dt>
              <dd>
                <a href={`tel:${settings.phoneHref}`} className="text-brand-600 hover:underline">
                  {settings.phoneDisplay}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">WhatsApp</dt>
              <dd>
                <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  {t.common.whatsapp}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-bold">{t.footer.address}</dt>
              <dd className="text-ink-soft">{fullAddress(settings)}</dd>
            </div>
          </dl>

          <LocationMap address={settings} className="mt-8 aspect-[16/9]" />
          <a href={mapsLink(settings)} target="_blank" rel="noopener noreferrer" className="btn-outline mt-4">
            {t.ui.openInMaps}
          </a>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <LeadForm phoneDisplay={settings.phoneDisplay} labels={t.lead} />
        </aside>
      </main>
    </SiteShell>
  );
}
