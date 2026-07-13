import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { PwaSplash } from "@/components/pwa/pwa-splash";
import { getCurrentAuth } from "@/lib/auth";
import { getEffectiveTheme } from "@/lib/theme";

/** Single family for UI + display avoids unused dual font preloads. */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "BCB Portal",
  description:
    "Secure paperless board governance for Bangladesh Cricket Board.",
  applicationName: "BCB Portal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BCB Portal"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#05382c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const auth = await getCurrentAuth();
  const appearance = await getEffectiveTheme(auth?.user.id);

  return (
    <html lang="en" data-theme={appearance.theme} className={outfit.variable} suppressHydrationWarning>
      <body className="pwa-body font-sans antialiased">
        <ThemeProvider initialTheme={appearance.theme} allowUserThemeSelection={appearance.allowUserThemeSelection}>
          <PwaRegister />
          <PwaSplash />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
