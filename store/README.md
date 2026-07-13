# Store packaging (Phase 2)

Thin native wrappers around the **same hosted Next.js PWA**. Business logic stays in the web app — do not fork APIs or auth into native code.

## Layout

| Path | Purpose |
| --- | --- |
| `android-twa/twa-manifest.json` | Bubblewrap Trusted Web Activity config for Google Play |
| `shell/www/` | Capacitor `webDir` fallback HTML (remote `server.url` loads the portal) |
| `../capacitor.config.ts` | Capacitor app id, splash, HTTPS server URL |
| `../app/.well-known/assetlinks.json` | Digital Asset Links API route |
| `../app/.well-known/apple-app-site-association` | iOS Universal Links API route |

## Google Play (TWA)

```bash
# 1. Set production host + signing fingerprints
export STORE_HOST=portal.your-domain.gov.bd
export TWA_PACKAGE_NAME=bd.org.bcb.directors.portal.twa
export TWA_SHA256_CERT_FINGERPRINTS=AA:BB:CC:...

npm run store:assetlinks
npm i -g @bubblewrap/cli
npm run store:android:init
npm run store:android:build
```

Upload the generated AAB from `store/android-twa/` to Play Console.

## App Store / alternate Android (Capacitor)

```bash
export CAPACITOR_SERVER_URL=https://portal.your-domain.gov.bd
export IOS_BUNDLE_ID=bd.org.bcb.directors.portal
export IOS_TEAM_ID=YOURTEAMID

npm run store:cap:sync
npm run store:cap:open:android   # Android Studio
npm run store:cap:open:ios       # Xcode (macOS)
```

Configure App Store Connect privacy, demo account, and screenshots before submission.

See [../docs/PWA_INSTALL_AND_DEPLOYMENT.md](../docs/PWA_INSTALL_AND_DEPLOYMENT.md) for full steps.
