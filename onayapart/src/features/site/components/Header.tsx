import SiteHeaderNav from "@/features/site/components/SiteHeaderNav";
import { getSiteNavigation } from "@/features/site/navigation";
import type { Locale } from "@/shared/i18n/config";
import { site } from "@/shared/lib/site";

export default async function Header({ locale }: { locale?: Locale } = {}) {
  const { settings, prefix, navItems, languages } = await getSiteNavigation(locale);

  return (
    <SiteHeaderNav
      navItems={navItems}
      languages={languages}
      homeHref={prefix || "/"}
      siteName={site.shortName}
      cityLabel={`${settings.addressCity} · ${settings.addressDistrict}`}
      phoneDisplay={settings.phoneDisplay}
      phoneHref={settings.phoneHref}
    />
  );
}
