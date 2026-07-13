# BCB Paperless Production Upgrade Plan

## Current Architecture Summary

BCB Paperless is a Next.js App Router application using React server components, client-side action controls, Prisma, and a SQLite database. The current app is an MVP/demo for BCB Directors' Affairs workflows, not a production governance system yet.

Current stack and locations:

- App routes: `app/(platform)/*`, protected by `app/(platform)/layout.tsx`.
- Public login route: `app/login/page.tsx`.
- API routes: `app/api/*`.
- Authentication/session helpers: `lib/auth.ts`.
- Audit hash chain: `lib/audit.ts` and `lib/hash.ts`.
- Prisma schema and demo data: `prisma/schema.prisma`, `prisma/seed.ts`.
- Local uploaded files: `storage/uploads`.
- Public static assets: `public`, including `bcb-logo.png` and `governance-boardroom.png`.
- Shared layout and UI: `components/app-shell.tsx`, `components/page-shell.tsx`, `components/metric-card.tsx`, `components/status-badge.tsx`, `components/ui/*`.

The platform layout calls `requireAuth()` and renders `AppShell`, so all routes under `app/(platform)` require a verified session. Most page-level role authorization is not enforced yet. Several API routes enforce role checks for specific mutations, but many read pages are visible to any authenticated user.

## Current Authentication

Implemented:

- Login API: `app/api/auth/login/route.ts`.
- MFA API: `app/api/auth/mfa/route.ts`.
- Logout API: `app/api/auth/logout/route.ts`.
- Session cookie: `bcb_session`.
- Pending MFA cookie: `bcb_pending_mfa`.
- Session duration: 30 minutes.
- Device register via `Device` model and `deviceId`.
- Login history via `LoginHistory`.
- Audit entries for failed login, password accepted, MFA success/failure, and logout.

Current demo limitations:

- Passwords are SHA-256 hashes via `hashPassword()` in `lib/auth.ts`, without salt, pepper, or adaptive hashing.
- All seeded users use `password123`.
- MFA uses a fixed `OTP_CODE = "123456"`.
- `encodePendingMfa()` is base64url JSON, not cryptographically signed or encrypted.
- New login creates a new demo device ID every time with `BCB-DEMO-*`.
- Device status is checked in the secure viewer and read/ack APIs only for revoked devices; trusted-device policy is not consistently enforced across all routes.
- There is no rate limiting, lockout, CAPTCHA, IP reputation, SSO, password reset, or account recovery.
- User `status` exists as a string but is not checked by `getCurrentAuth()`.

Required production upgrade:

- Replace SHA-256 passwords with Argon2id or bcrypt.
- Replace fixed demo MFA with TOTP, WebAuthn/passkeys, or enterprise IdP MFA.
- Sign/encrypt temporary MFA state or store it server-side.
- Enforce user status, session revocation, device trust, and expiry at the authorization layer.
- Add rate limiting for login, MFA, document access, and mutation APIs.
- Add CSRF protection for cookie-authenticated POST routes.
- Add secure cookie options suitable for production deployment.

## Current Database Schema

The schema is broad and useful for production planning. Existing models include:

- Identity and auth: `User`, `Session`, `Device`, `LoginHistory`.
- Governance setup: `Committee`, `CommitteeMember`.
- Memo workflow: `Memo`, `MemoHistory`, `MemoComment`.
- Documents: `Document`, `DocumentVersion`.
- Meetings and agenda: `Meeting`, `MeetingAttendee`, `AgendaItem`, `AgendaDocument`.
- Board packs: `BoardPack`, `ReadAcknowledgment`.
- Minutes: `Minute`.
- Resolutions/actions: `Resolution`, `ActionItem`.
- Access workflow: `AccessRequest`.
- Archive: `ArchiveRecord`.
- Notifications: `Notification`.
- Audit: `AuditLog`.
- Backup posture: `BackupStatus`.

Existing enums include roles, device status, confidentiality, memo/document/minutes/resolution/action/access statuses, OCR/QC statuses, retention statuses, and meeting types/statuses.

Important production gaps in schema:

- No formal permission table or role-permission mapping.
- No document ACL model separate from `AccessRequest`.
- No board pack recipient/assignment table.
- No persisted private notes or bookmarks for board packs.
- No durable file object metadata table with storage provider, checksum, MIME type, size, encryption metadata, and virus scan status.
- No OCR job table, conversion job table, render job table, or background processing state.
- No immutable audit export/snapshot table.
- No e-signature/approval evidence table beyond status/history fields.
- No notification delivery status per channel beyond a JSON/string `channelLog`.
- No migration from SQLite to production database provider.

## Existing Roles

Defined in `prisma/schema.prisma`:

- `SYSTEM_ADMIN`
- `COMPANY_SECRETARY`
- `BOARD_CHAIRMAN`
- `DIRECTOR`
- `COMMITTEE_MEMBER`
- `DEPARTMENT_USER`
- `ARCHIVE_USER`
- `AUDITOR`

Existing role helper functions:

- `canUseSecretaryControls(role)`: `SYSTEM_ADMIN`, `COMPANY_SECRETARY`, `BOARD_CHAIRMAN`.
- `canAdminister(role)`: `SYSTEM_ADMIN`.
- `canApproveAsChairman(role)`: `BOARD_CHAIRMAN`, `SYSTEM_ADMIN`.

Current issue:

- Navigation in `lib/navigation.ts` is global and not role-filtered.
- Page-level read access is mostly any authenticated user.
- Admin and audit pages call `requireAuth()` only. They do not currently restrict page visibility to Admin/Auditor roles.

See `docs/ROLE_PERMISSION_MATRIX.md` for the proposed production permission model.

## Current Dashboard and Navigation

Dashboard:

- File: `app/(platform)/dashboard/page.tsx`.
- Role-specific focus labels and item lists are computed by `roleFocus()`.
- Metrics cover meetings, pending approvals, documents, audit warnings, acknowledgments, archive completion, recent documents, notifications, action items, and workflow shortcuts.
- Uses `MetricCard`, `StatusBadge`, `WorkflowTimeline`, `Card`, `Badge`, and `PageShell`.

Navigation:

- File: `lib/navigation.ts`.
- Primary items: Dashboard, Memo Workflow, Meetings, Board Packs, Documents, Archive, Minutes, Resolutions, Action Items, Committees, Access Requests, Notifications, Reports, Backup & DR, Admin, Audit Logs, Demo Journey.
- Secondary/demo items include Secure Viewer, Archive Pilot, Executive Reports.

Production upgrade:

- Add role-aware navigation filtering.
- Add route metadata for required permissions.
- Remove or hide demo-only navigation entries in production.
- Ensure dashboard metrics are scoped to the user's role, committees, assignments, and document grants.

## Current Workflow Coverage

### Documents and Storage

Implemented:

- Document repository route: `app/(platform)/documents/page.tsx`.
- Document detail/viewer route: `app/(platform)/documents/[id]/page.tsx`.
- Upload form: `components/document-upload-form.tsx`.
- Upload API: `app/api/documents/upload/route.ts`.
- Uploaded files are stored locally under `storage/uploads`.
- Metadata is saved to `Document`.
- Read and acknowledgment APIs create `ReadAcknowledgment` and audit logs.

Missing or weak:

- Uploaded files are not rendered by the secure viewer; viewer uses `simulatedOcrText`.
- File access is not protected by a streaming authorization endpoint.
- File type validation relies on client `accept` and no server MIME/magic-byte validation.
- No malware scanning.
- No encryption-at-rest metadata.
- No checksum/deduplication.
- No approval/lock workflow API for uploaded documents.
- No document version upload API after initial upload.
- Access requests do not currently gate viewer access.

### Secure Document Viewer

Implemented:

- Component: `components/secure-viewer.tsx`.
- Displays document metadata and simulated OCR text.
- Dynamic watermark includes user, role, timestamp, device ID, IP, document ID, and session token slice.
- Blocks context menu and Ctrl/Cmd+P/S/C in the browser.
- Blurs when browser loses focus.
- Blocks rendering when device status is `REVOKED`.
- Records read and acknowledgment events through APIs.

Missing or weak:

- Browser controls are deterrents, not true data-loss prevention.
- No PDF/image rendering pipeline.
- No page-level render tokens.
- No per-document authorization check in the page or read/ack APIs beyond authentication and revoked-device check.
- No enforcement of access approval/expiry/confidentiality role rules.
- No duplicate prevention for read/ack records.
- No screen capture detection, print pipeline control, or server-side watermarking.

See `docs/SECURE_DOCUMENT_VIEWER_SPEC.md`.

### Board-Pack Workflow

Implemented:

- List route: `app/(platform)/board-packs/page.tsx`.
- Detail route: `app/(platform)/board-packs/[id]/page.tsx`.
- Pack acknowledgment API: `app/api/board-packs/[id]/acknowledge/route.ts`.
- Pack acknowledgment button: `components/board-pack-ack-button.tsx`.
- Board packs are linked to meetings, agenda items, and documents.
- Detail page reuses `SecureViewer`.

Missing:

- No API to create, compile, approve, publish, unpublish, or revise board packs.
- No recipient assignment table.
- No persisted private notes or bookmarks.
- No pack-level role/recipient gating.
- No per-agenda read completion tracking beyond generic `ReadAcknowledgment`.
- No publication approval evidence beyond seeded fields and `historyJson`.

### Archive

Implemented:

- Route: `app/(platform)/archive/page.tsx`.
- Displays `ArchiveRecord` rows, OCR/QC status, metadata completion, physical references, batch numbers, and final lock status.

Missing:

- No archive ingestion workflow.
- No OCR/QC update API.
- No batch management API.
- No final lock mutation with audit evidence.
- No link between archive lock and document immutability enforcement.

### Memo

Implemented:

- Route: `app/(platform)/memo-workflow/page.tsx`.
- Create form/API: `components/memo-create-form.tsx`, `app/api/memos/create/route.ts`.
- Status transition API: `app/api/memos/[id]/advance/route.ts`.
- Action buttons: `components/memo-action-buttons.tsx`.
- Memo history records are created on transitions.
- Secretary/chairman restrictions are enforced for selected API transitions.

Missing or weak:

- Memo creation is available to any authenticated user.
- Transition order is not validated against current status.
- `submit` transition is unrestricted.
- No attachment upload/linking flow for memos.
- No comment creation UI/API despite `MemoComment` model.
- No meeting agenda attachment API for approved memos.
- No e-signature or approval evidence table.

### Minutes

Implemented:

- Route: `app/(platform)/minutes/page.tsx`.
- Displays seeded minutes, attendance JSON, discussion JSON, drafter/approver, and status.

Missing:

- No draft/edit/submit/return/approve/lock APIs.
- No agenda-wise editor.
- No director acknowledgment of final minutes.
- No immutable locked-minutes enforcement.
- No minutes-to-resolution generation flow.

### Resolutions and Action Items

Implemented:

- Resolutions route: `app/(platform)/resolutions/page.tsx`.
- Action items route: `app/(platform)/action-items/page.tsx`.
- Schema links resolutions to meetings, agenda items, documents, and action items.
- Seeded statuses and timelines are displayed.

Missing:

- No generate/publish/update resolution APIs.
- No action item creation/update/closure APIs.
- No reminder/escalation jobs.
- No closure approval workflow.
- No implementation evidence upload flow.

### Audit

Implemented:

- Hash-chained audit creation: `lib/audit.ts`.
- Hash verification: `verifyAuditChain()`.
- Audit log page: `app/(platform)/audit-logs/page.tsx`.
- Many important demo actions call `createAuditLog()`.

Missing or weak:

- `createAuditLog()` computes next sequence by reading latest row; concurrent writes can race.
- Audit logs are in the same mutable database as application data.
- No append-only database constraint or external immutable export.
- Audit page is visible to any authenticated user.
- Some UI claims mention logged blocked viewer actions, but blocked context menu/keyboard events are not actually sent to the server.

### Admin, Backup, Reports, Notifications

Implemented:

- Admin page displays users, devices, setup metrics, backup posture.
- Device status API is restricted to `SYSTEM_ADMIN`.
- Backup & DR page displays simulated `BackupStatus`.
- Reports page aggregates seeded data.
- Notifications can be marked read through `app/api/notifications/[id]/read/route.ts`.

Missing:

- Admin page is not page-gated to admin.
- No user CRUD, role assignment, committee setup CRUD, or retention policy CRUD.
- Backup is simulated; no real backup/restore jobs.
- Reports are dashboard summaries, not exportable signed reports.
- Notifications are in-app only, with simulated channel logs.

## Reusable Components and Utilities

Reuse these before building new UI:

- Layout: `components/app-shell.tsx`, `components/page-shell.tsx`.
- Metrics/status: `components/metric-card.tsx`, `components/status-badge.tsx`, `components/session-badge.tsx`, `components/workflow-timeline.tsx`.
- Forms/actions: `components/document-upload-form.tsx`, `components/memo-create-form.tsx`, `components/memo-action-buttons.tsx`, `components/access-request-controls.tsx`, `components/request-access-button.tsx`, `components/board-pack-ack-button.tsx`, `components/device-status-controls.tsx`, `components/notification-read-button.tsx`.
- Secure viewing: `components/secure-viewer.tsx`.
- UI primitives: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/badge.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`.
- Helpers: `lib/auth.ts`, `lib/audit.ts`, `lib/hash.ts`, `lib/labels.ts`, `lib/navigation.ts`, `lib/prisma.ts`, `lib/utils.ts`.

Features that already exist and must not be duplicated:

- Session cookie authentication wrapper through `requireAuth()`.
- Hash-chained audit logging helpers.
- Status labeling and badge tone helpers.
- Page shell/app shell layout.
- Basic document upload and document metadata creation.
- Memo creation and status transition APIs.
- Access request creation/decision APIs.
- Document and board-pack acknowledgment APIs.
- Device status update API.

## Security Weaknesses to Address

Highest priority:

- Demo credentials and fixed OTP.
- Weak password hashing.
- Missing role-based page authorization.
- Missing document access enforcement by role, confidentiality, board-pack assignment, access request approval, and expiry.
- Uploaded files stored locally without validation, scanning, encryption, or protected streaming.
- CSRF protection missing for cookie-authenticated mutations.
- API input validation is minimal.
- Audit sequence can race under concurrent writes.

Medium priority:

- Navigation exposes all modules to all authenticated users.
- Viewer blocked actions are client-only and not server-audited.
- Private notes/bookmarks are UI-only.
- Backup and DR are simulated.
- No production logging/monitoring/alerting.
- No test suite observed for authorization boundaries.

## Required Database Migrations

Plan migrations after confirming production scope:

1. Move database provider from SQLite to PostgreSQL or another production RDBMS.
2. Add password hash metadata fields or migrate `User.passwordHash` to Argon2id/bcrypt-compatible format.
3. Add formal permission models:
   - `Permission`
   - `RolePermission`
   - optional `UserPermissionOverride`
4. Add document access control:
   - `DocumentGrant`
   - `BoardPackRecipient`
   - `DocumentAccessPolicy`
5. Add durable file metadata:
   - `FileObject`
   - fields for storage key, provider, size, MIME type, checksum, encrypted flag, encryption key reference, virus scan status, conversion status.
6. Add viewer/rendering support:
   - `DocumentRenderJob`
   - `DocumentPageImage`
   - `ViewerSession`
   - `ViewerEvent`
7. Add board-pack production workflow:
   - `BoardPackVersion`
   - `BoardPackDocument`
   - `BoardPackRecipient`
   - persisted `BoardPackNote`
   - persisted `BoardPackBookmark`
8. Add archive workflow:
   - `ArchiveBatch`
   - `ArchiveQcEvent`
   - `OcrJob`
9. Add approval/e-signature evidence:
   - `Approval`
   - `SignatureEvidence`
10. Add audit hardening:
   - database sequence/transaction strategy
   - immutable export/checkpoint table
   - optional WORM storage export metadata
11. Add notification delivery:
   - `NotificationDelivery`
   - per-channel delivery status, provider message ID, failure reason.

## Routes and Files Expected to Change

Authentication and authorization:

- `lib/auth.ts`
- new `lib/permissions.ts`
- new route guard helpers, possibly `middleware.ts`
- `app/(platform)/layout.tsx`
- all `app/(platform)/*/page.tsx` routes for permission gating
- all `app/api/*/route.ts` routes for permission checks, validation, and CSRF

Documents and secure viewer:

- `app/(platform)/documents/page.tsx`
- `app/(platform)/documents/[id]/page.tsx`
- `app/api/documents/upload/route.ts`
- `app/api/documents/[id]/read/route.ts`
- `app/api/documents/[id]/acknowledge/route.ts`
- new document streaming/render APIs
- `components/secure-viewer.tsx`
- `components/document-upload-form.tsx`
- `components/request-access-button.tsx`

Board packs:

- `app/(platform)/board-packs/page.tsx`
- `app/(platform)/board-packs/[id]/page.tsx`
- `app/api/board-packs/[id]/acknowledge/route.ts`
- new board-pack create/compile/publish/revision APIs
- `components/board-pack-ack-button.tsx`

Workflow modules:

- `app/(platform)/memo-workflow/page.tsx`
- `app/api/memos/create/route.ts`
- `app/api/memos/[id]/advance/route.ts`
- `components/memo-create-form.tsx`
- `components/memo-action-buttons.tsx`
- `app/(platform)/minutes/page.tsx`
- `app/(platform)/resolutions/page.tsx`
- `app/(platform)/action-items/page.tsx`
- `app/(platform)/archive/page.tsx`

Admin/audit/reporting:

- `app/(platform)/admin/page.tsx`
- `app/api/devices/[id]/status/route.ts`
- `app/(platform)/audit-logs/page.tsx`
- `lib/audit.ts`
- `app/(platform)/reports/page.tsx`
- `app/(platform)/backup-dr/page.tsx`
- `app/(platform)/notifications/page.tsx`
- `app/api/notifications/[id]/read/route.ts`

Schema and seed:

- `prisma/schema.prisma`
- future migration files under `prisma/migrations`
- `prisma/seed.ts` after production-safe seed strategy is defined.

## Proposed Implementation Order

1. Authorization foundation
   - Define permission map.
   - Add server-side permission checks.
   - Filter navigation and dashboards by role.
   - Gate Admin/Audit/Reports/Backup pages.

2. Authentication hardening
   - Replace password hashing.
   - Replace fixed OTP.
   - Add account status checks, rate limiting, CSRF, and session revocation.

3. Document access enforcement
   - Implement document grants.
   - Enforce confidentiality rules.
   - Make access-request approval/expiry control actual viewer access.

4. Storage and secure viewer upgrade
   - Add file metadata.
   - Add file validation, scanning hooks, protected streaming/rendering.
   - Add server-side watermark/render events.

5. Board-pack publication workflow
   - Add compile, publish, recipients, versioning, notes, bookmarks.
   - Integrate read/ack tracking per recipient and agenda.

6. Memo workflow completion
   - Validate state transitions.
   - Add comments, attachments, agenda linking, e-signature evidence.

7. Minutes, resolutions, and action item workflows
   - Add create/edit/approve/lock/generate/close APIs.
   - Add reminders and escalation.

8. Archive production workflow
   - Add batches, OCR jobs, QC events, final lock enforcement.

9. Audit and DR hardening
   - Transaction-safe audit sequence.
   - Immutable export/checkpointing.
   - Real backup and restore procedures.

10. Test and compliance pass
   - Add authorization tests, API tests, viewer tests, audit-chain tests, and migration tests.

## Expected Affected Files

See the "Routes and Files Expected to Change" section. The highest-impact files are:

- `prisma/schema.prisma`
- `lib/auth.ts`
- `lib/audit.ts`
- new `lib/permissions.ts`
- `lib/navigation.ts`
- `app/(platform)/layout.tsx`
- all workflow pages under `app/(platform)`
- all mutation APIs under `app/api`
- `components/secure-viewer.tsx`
- form/action components under `components`.

## Risks

- Authorization mistakes could expose confidential or highly confidential board materials.
- Migrating from SQLite to a production database may require data transformation and ID strategy decisions.
- Secure document viewing cannot rely only on browser-side controls; server-side rendering and access checks are required.
- Audit hash chains can break if migration changes timestamp precision or serialization.
- Local file storage is not sufficient for multi-user production deployment.
- Background processing for OCR/rendering/scanning introduces operational complexity.
- Current seeded/demo data may hide missing production workflows.
- Broad schema changes should be phased to avoid blocking the existing MVP demo.

## Decisions Requiring Confirmation

- Production identity provider: local auth, Microsoft Entra ID, Google Workspace, SAML, or another IdP.
- MFA method: TOTP, SMS/email OTP, WebAuthn/passkeys, or IdP-managed MFA.
- Production database: PostgreSQL, SQL Server, MySQL, or managed Prisma-compatible service.
- File storage: local server, S3-compatible object storage, Azure Blob, Google Cloud Storage, or on-premises storage.
- OCR/rendering pipeline: server-side PDF rendering, Office conversion, external OCR provider, or local OCR engine.
- Confidentiality policy: exact role/committee/document assignment rules for each confidentiality level.
- Board-pack recipients: all directors by default, committee-specific recipients, or per-pack manual assignments.
- Audit retention and export requirements: database-only, periodic signed export, or WORM/immutable storage.
- Backup RPO/RTO targets.
- Whether demo routes such as `demo-journey` and secondary nav entries remain in production.
