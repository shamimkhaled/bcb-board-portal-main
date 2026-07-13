import { PageShell } from "@/components/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { requireAuth } from "@/lib/auth";
import { getEffectiveTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ProfileAppearancePage() {
  const auth = await requireAuth();
  const appearance = await getEffectiveTheme(auth.user.id);

  return (
    <PageShell
      eyebrow="Profile"
      title="Appearance"
      description="Choose the portal theme applied to navigation, dashboard surfaces, forms, controls, and secure viewer shell."
    >
      <Card>
        <CardHeader>
          <CardTitle>Theme Preference</CardTitle>
          <CardDescription>
            Document pages remain neutral for readability. The viewer shell and portal chrome follow your selected theme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector currentTheme={appearance.theme} />
        </CardContent>
      </Card>
    </PageShell>
  );
}
