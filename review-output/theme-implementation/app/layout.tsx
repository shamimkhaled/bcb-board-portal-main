import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getCurrentAuth } from "@/lib/auth";
import { getEffectiveTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "BCB Directors' Affairs Automation Platform",
  description:
    "Secure paperless board governance, meeting management, archive, and audit platform for Bangladesh Cricket Board."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAuth();
  const appearance = await getEffectiveTheme(auth?.user.id);

  return (
    <html lang="en" data-theme={appearance.theme} suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={appearance.theme} allowUserThemeSelection={appearance.allowUserThemeSelection}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
