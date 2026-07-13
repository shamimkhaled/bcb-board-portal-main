import { AppShell } from "@/components/app-shell";
import { requireAuth } from "@/lib/auth";
import { role } from "@/lib/labels";
import { navItems } from "@/lib/navigation";
import { getVisibleModules } from "@/lib/permissions";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAuth();
  const visibleModules = await getVisibleModules(auth.user);
  const visibleModuleKeySet = new Set(visibleModules.map((module) => module.key));
  const sortByModuleKey = new Map(visibleModules.map((module) => [module.key, module.sortOrder]));
  const visibleNavigation = navItems
    .filter((item) => visibleModuleKeySet.has(item.moduleKey))
    .sort((a, b) => (sortByModuleKey.get(a.moduleKey) ?? 0) - (sortByModuleKey.get(b.moduleKey) ?? 0));

  return (
    <AppShell
      user={{
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        roleLabel: role(auth.user.role)
      }}
      session={{
        expiresAt: auth.session.expiresAt.toISOString(),
        deviceId: auth.session.deviceId
      }}
      navigationItems={visibleNavigation.map((item) => ({
        href: item.href,
        label: item.label,
        moduleKey: item.moduleKey,
        secondary: "secondary" in item ? item.secondary : false
      }))}
    >
      {children}
    </AppShell>
  );
}
