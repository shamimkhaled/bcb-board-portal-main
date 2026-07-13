# PWA install & deployment guide

## Local development

```bash
npm install
npm run db:init
npm run dev
```

Service workers are **disabled in development** (`next.config.mjs` via `@ducanh2912/next-pwa`). Installability and offline caching apply to production builds:

```bash
npm run build
npm run start
```

Open `http://localhost:3005` (or your HTTPS production URL).

## Generate Web Push VAPID keys

```bash
npx web-push generate-vapid-keys
```

Add to `.env` / `.env.local`:

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:portal-admin@bcb.example"
```

Enable push from **More → Enable push alerts** after signing in (requires an active service worker, so use a production build or HTTPS).

Notification type codes ready for server send: `NEW_MEETING`, `AGENDA_PUBLISHED`, `MEETING_REMINDER`, `APPROVAL_PENDING`, `DOCUMENT_SHARED`, `RESOLUTION_SIGNED`, `CIRCULAR_PUBLISHED` (see `lib/push.ts`).

## Install on Android (Chrome / Edge — browser)

1. Open the portal over **HTTPS**.
2. Wait for the **Install BCB Portal** banner, or use the browser menu → **Install app** / **Add to Home screen**.
3. Launch from the home screen — the app opens in **standalone** mode (no browser chrome).

## Install on iOS (Safari)

1. Open the portal in **Safari** (not Chrome-in-app).
2. Tap the **Share** button.
3. Choose **Add to Home Screen**.
4. Confirm **Add**. Launch from the icon for a fullscreen experience.

iOS does not support `beforeinstallprompt`; the in-app banner shows Share → Add to Home Screen instructions.

## Desktop install

Chrome / Edge: install icon in the address bar, or the in-app Install banner when supported.

## Offline behaviour (TRD)

**Available offline (when previously cached):** shell chrome, login UI, dashboard shell, previously viewed meeting/agenda/profile pages, static assets.

Visited routes are recorded in IndexedDB (`VisitedPageTracker`) to support “previously accessed” offline behaviour.

**Not available offline:** authentication, meeting create, approvals, uploads, admin, live notifications.

## Lighthouse / QA checks

```bash
npm run build && npm run start
npx lighthouse http://localhost:3005/login --only-categories=pwa,performance,accessibility,best-practices --view
npm run qa:smoke
```

Playwright projects include desktop, tablet, and Pixel 5 (`playwright.config.ts`).

---

## Phase 2 — store packaging (implemented scaffolding)

Native store apps are **thin wrappers** around the hosted HTTPS PWA. Auth, Prisma, RBAC, and the secure viewer remain in Next.js.

| Store | Wrapper | Config |
| --- | --- | --- |
| Google Play | Trusted Web Activity (Bubblewrap) | [`store/android-twa/twa-manifest.json`](../store/android-twa/twa-manifest.json) |
| App Store (+ optional Play) | Capacitor shell | [`capacitor.config.ts`](../capacitor.config.ts) |

Also see [`store/README.md`](../store/README.md).

### Environment variables

```bash
# Production origin (no trailing slash)
STORE_ORIGIN="https://portal.your-domain.gov.bd"
STORE_HOST="portal.your-domain.gov.bd"
CAPACITOR_SERVER_URL="https://portal.your-domain.gov.bd"

# Android TWA / Digital Asset Links
TWA_PACKAGE_NAME="bd.org.bcb.directors.portal.twa"
TWA_SHA256_CERT_FINGERPRINTS="AABBCCDDEEFF..."   # upload keystore SHA-256, colonless OK

# iOS / App Store
IOS_BUNDLE_ID="bd.org.bcb.directors.portal"
IOS_TEAM_ID="YOURTEAMID"
```

Well-known endpoints (served by Next.js):

- `GET /.well-known/assetlinks.json`
- `GET /.well-known/apple-app-site-association`

### Google Play (Bubblewrap TWA)

Prerequisites: JDK 17+, Android SDK, `npm i -g @bubblewrap/cli`.

```bash
export STORE_HOST=portal.your-domain.gov.bd
export TWA_PACKAGE_NAME=bd.org.bcb.directors.portal.twa
export TWA_SHA256_CERT_FINGERPRINTS=YOUR_UPLOAD_CERT_SHA256

npm run store:assetlinks
# Deploy Next.js so https://$STORE_HOST/manifest.webmanifest and assetlinks are live

npm run store:android:init
npm run store:android:build
```

Upload the AAB from `store/android-twa/` to Play Console. Verify Digital Asset Links with:

```bash
curl -s https://$STORE_HOST/.well-known/assetlinks.json
```

Google’s statement list tester: https://developers.google.com/digital-asset-links/tools/generator

### Apple App Store (Capacitor)

Prerequisites: macOS + Xcode for iOS; Android Studio optional for a second Android listing.

```bash
export CAPACITOR_SERVER_URL=https://portal.your-domain.gov.bd
export IOS_BUNDLE_ID=bd.org.bcb.directors.portal
export IOS_TEAM_ID=YOURTEAMID

npm run store:cap:sync
npm run store:cap:open:ios
```

In Xcode: set signing team, archive, upload to App Store Connect. Provide a demo director account, privacy policy URL, and note that content is loaded from your secured HTTPS board portal.

Android Studio path (same shell):

```bash
npm run store:cap:open:android
```

### App Review / Play Console checklist

- [ ] Production HTTPS portal live with valid TLS
- [ ] `assetlinks.json` fingerprints match the Play upload key
- [ ] `apple-app-site-association` uses correct Team ID + bundle ID
- [ ] Demo credentials documented for reviewers
- [ ] Privacy policy URL live
- [ ] Screenshots for phone / tablet store listings
- [ ] No confidential PDFs exposed via public URLs (secure viewer unchanged)

### Future (architecture must not block)

WebAuthn biometrics, camera / QR scanning, calendar sync — keep feature detection and progressive enhancement inside the web app; Capacitor plugins can be added later without rewriting business logic.
