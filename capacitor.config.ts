import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Thin native shell that loads the hosted Next.js PWA over HTTPS.
 * Set CAPACITOR_SERVER_URL (or STORE_ORIGIN) to your production origin.
 * Do not point this at localhost for store builds.
 */
const serverUrl = (
  process.env.CAPACITOR_SERVER_URL ||
  process.env.STORE_ORIGIN ||
  "https://portal.bcb.example"
).replace(/\/$/, "");

const host = serverUrl.replace(/^https?:\/\//, "");

const config: CapacitorConfig = {
  appId: process.env.IOS_BUNDLE_ID || "bd.org.bcb.directors.portal",
  appName: "BCB Portal",
  webDir: "store/shell/www",
  server: {
    url: serverUrl,
    cleartext: false,
    allowNavigation: [host]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: "#006A4E",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#006A4E"
    }
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#006A4E"
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#006A4E",
    preferredContentMode: "mobile",
    scheme: "BCB Portal"
  }
};

export default config;
