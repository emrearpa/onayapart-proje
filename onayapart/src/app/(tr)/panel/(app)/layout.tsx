import PanelShell from "@/shared/components/panel/PanelShell";
import { requirePanel } from "@/features/auth/guards";
import { visibleNavGroups } from "@/features/auth/panel-nav";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePanel();
  const navGroups = visibleNavGroups(session);
  const homeHref = navGroups[0]?.[0]?.href ?? "/panel";
  const userLabel = session.role === "admin" ? "Yönetim paneli" : session.name;

  return (
    <PanelShell groups={navGroups} homeHref={homeHref} userLabel={userLabel}>
      {children}
    </PanelShell>
  );
}
