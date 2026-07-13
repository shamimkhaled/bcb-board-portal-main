# Android TWA (Trusted Web Activity)

Bubblewrap project config for publishing the BCB PWA to Google Play.

## Files

- `twa-manifest.json` — Bubblewrap application definition (package id, host, theme, shortcuts)

Generated on init/build (gitignored):

- `app/` — Android Studio / Gradle project
- `*.aab` / keystore artifacts

## Commands

From repo root (`bcb-board-portal-main`):

```bash
export STORE_HOST=portal.your-domain.gov.bd
export TWA_PACKAGE_NAME=bd.org.bcb.directors.portal.twa
export TWA_SHA256_CERT_FINGERPRINTS=YOUR_CERT_SHA256

npm run store:android:init
npm run store:android:build
```

Requires `@bubblewrap/cli`, JDK 17+, and Android SDK.
