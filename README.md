# BCB Directors' Affairs Automation Platform

Production-style MVP+ for a secure paperless board governance, meeting management, directors' dashboard, digital archive, document repository, and audit platform for Bangladesh Cricket Board.

## Setup

```bash
npm install
npm run db:init
npm run dev
```

The app runs on [http://localhost:3005](http://localhost:3005). The `dev` script is configured as `next dev -p 3005`.

`db:init` creates `prisma/dev.db` from the Prisma schema, generates Prisma Client, and seeds the demo data. It exists because `prisma db push` can fail silently on some Windows/OneDrive setups even when the schema is valid.

## Demo Credentials

All accounts use password `password123`. The fake MFA code is `123456`.

| Email | Role |
| --- | --- |
| admin@bcb.test | System Admin |
| secretary@bcb.test | Company Secretary |
| chairman@bcb.test | Board Chairman |
| director1@bcb.test | Director |
| director2@bcb.test | Director |
| committee@bcb.test | Committee Member |
| department@bcb.test | Department User |
| archive@bcb.test | Archive User |
| auditor@bcb.test | Auditor |

## MVP+ Features

- Credentials login, fake MFA, login history, failed-login audit, session timer, role shown in top bar.
- Role-aware dashboards for directors, secretary, chairman, admin, archive user, and other users.
- Memo workflow with department submission, secretary review/return, chairman approve/reject, comments, approval history, and audit logging.
- Meeting management with attendees, agenda items, approved memo/document attachments, timelines, attendance and board-pack publication state.
- Board pack viewer with agenda panel, secure document viewer, private notes area, bookmarks demo, read tracking, and acknowledgment.
- Document repository with local file upload storage, metadata, auto document IDs, search filters, versions, retention, OCR/QC statuses, access requests, and secure viewer.
- Secure viewer controls: no download/print UI, no direct file URL display, right-click and Ctrl+P/S/C blocking, focus blur, warning toast, dynamic watermark, read/ack buttons, device-status block screen.
- Device authorization with trusted/untrusted/revoked status and admin trust/revoke controls.
- Minutes, resolutions, action items, committees, access requests, notification center, reports, archive pilot, Backup & DR posture, admin, and audit logs.
- Hash-chained audit log with “Integrity Verified” or “Tamper Warning” display.
- Executive “Demo Journey” page linking the full proof path from memo submission to audit trail.

## Seed Data

The seed includes users, roles, committees, 3 board meetings, 1 AGM, 2 committee meetings, 15 documents, 5 memos, 5 access requests, 5 resolutions, 10 action items, 20 notifications, 50 audit logs, archive records for 2022-2026, backup records, and device records.

All data is realistic but fake BCB-style sample data and does not contain sensitive real information.

## Progressive Web App (PWA)

Phase 1 adds an installable, native-like mobile experience on top of this portal:

- Web app manifest + icons (`public/manifest.webmanifest`, `public/icons/`)
- Service worker via `@ducanh2912/next-pwa` (Next 15–compatible `next-pwa` fork; production builds only)
- Mobile bottom navigation, install prompts (Android + iOS guidance), offline banner
- Document Hub-style mobile Meetings + Search screens
- Web Push subscription API stub (`/api/push/subscribe`) — configure VAPID keys in `.env`

### Phase 2 — Play Store / App Store wrappers

- **Google Play:** Bubblewrap TWA (`store/android-twa/`, `npm run store:android:init` / `store:android:build`)
- **App Store:** Capacitor thin shell (`capacitor.config.ts`, `npm run store:cap:sync`)
- Digital Asset Links + Apple App Site Association routes under `app/.well-known/`

See [docs/PWA_INSTALL_AND_DEPLOYMENT.md](docs/PWA_INSTALL_AND_DEPLOYMENT.md) and [store/README.md](store/README.md).

## Production Limitations

- Web screenshot blocking is limited.
- The MVP provides watermarking, shortcut blocking, audit logs, viewer controls, and device checks, but browsers cannot guarantee screenshot prevention.
- Real OCR is not included; the MVP uses simulated OCR text fields.
- Real SMS/email gateway integration is not included.
- Real MFA is not included.
- Real encryption, key management, malware scanning, and object storage must be added for production.
- Real BDCCL and BCB edge node synchronization is not implemented in this laptop MVP.
- Native mobile/tablet apps are needed for stronger screenshot and screen-recording controls.

## Future Production Roadmap

- Add enterprise identity integration, phishing-resistant MFA, conditional access, and formal session/device policies.
- Move documents to encrypted object storage with signed backend-only retrieval, malware scanning, and key rotation.
- Add native iPad/Android director apps with managed device controls, screen-recording restrictions, offline encrypted packs, and remote wipe (Phase 2 TWA/Capacitor scaffolding is in `store/` and `capacitor.config.ts`).
- Integrate OCR, classification, metadata extraction, retention workflows, and legal hold governance.
- Implement real email/SMS/push integrations that send notifications without confidential attachments.
- Add immutable audit export, SIEM integration, backup encryption, restore drills, RPO/RTO reporting, and BDCCL/edge synchronization.
- Expand granular RBAC/ABAC, committee access boundaries, approval delegation, and document-level expiry enforcement.
