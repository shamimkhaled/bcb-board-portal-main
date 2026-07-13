# Secure Document Viewer Specification

## Purpose

This document specifies the production upgrade path for the BCB Paperless secure document viewer. It is based on the current codebase, especially:

- `components/secure-viewer.tsx`
- `app/(platform)/documents/[id]/page.tsx`
- `app/(platform)/board-packs/[id]/page.tsx`
- `app/api/documents/[id]/read/route.ts`
- `app/api/documents/[id]/acknowledge/route.ts`
- `app/api/board-packs/[id]/acknowledge/route.ts`
- `app/api/access-requests/create/route.ts`
- `app/api/access-requests/[id]/decision/route.ts`
- `app/api/documents/upload/route.ts`
- `prisma/schema.prisma`

The current viewer is a strong MVP prototype for board governance demos. It must be hardened before production use with confidential BCB documents.

## Current Viewer Behavior

Implemented in `components/secure-viewer.tsx`:

- Renders a protected document panel inside the app.
- Displays document ID, confidentiality, version, title, and document type.
- Displays `simulatedOcrText` as the document body.
- Shows watermark text repeatedly across the page.
- Watermark includes:
  - user name
  - user role label
  - current timestamp
  - session device ID
  - session IP address
  - document ID
  - first 12 characters of session token
- Blocks browser context menu.
- Blocks Ctrl/Cmd+P, Ctrl/Cmd+S, and Ctrl/Cmd+C.
- Blurs document area when browser focus is lost or visibility changes.
- Shows a warning toast for blocked client actions.
- Blocks rendering if the current device status is `REVOKED`.
- Provides "Mark as Read" and "Acknowledge" buttons.
- Calls read and acknowledgment APIs.

Current routes that embed the viewer:

- Document detail: `app/(platform)/documents/[id]/page.tsx`.
- Board pack detail: `app/(platform)/board-packs/[id]/page.tsx`, using the first attached agenda document.

Current read/ack persistence:

- `ReadAcknowledgment` model stores user, document, board pack, agenda item, type, page, session, and timestamp.
- Document read API creates type `READ`.
- Document acknowledgment API creates type `ACK`.
- Board pack acknowledgment API creates type `ACK` with `boardPackId`.
- All three APIs write audit logs.

## Current Storage and Rendering Baseline

Current upload behavior:

- `app/api/documents/upload/route.ts` accepts form data and a `File`.
- Files are written to `storage/uploads`.
- File path is saved in `Document.filePath`.
- Original file name is saved in `Document.fileName`.
- Metadata is saved to `Document`.
- `Document.simulatedOcrText` is set to a placeholder.

Current viewer rendering:

- The uploaded file itself is not rendered.
- There is no protected download or streaming endpoint.
- The viewer renders metadata and simulated OCR text only.
- Seeded documents usually have `filePath = null`.

Production implication:

- The viewer should be treated as a controlled preview shell, not a secure file renderer yet.

## Current Access Model

Implemented:

- `requireAuth()` gates document and board-pack pages.
- Viewer blocks revoked devices.
- Read/ack APIs reject revoked devices.
- Access requests can be created.
- Secretary/Admin/Chairman per `canUseSecretaryControls()` can approve/reject access requests.
- Approved requests get an expiry date.

Not implemented:

- Document pages do not enforce access request approval or expiry before rendering.
- Document pages do not enforce confidentiality-level rules.
- Board-pack pages do not enforce recipient assignment.
- Read/ack APIs do not verify that the user is authorized for the document or board pack.
- Access requests are currently workflow records, not effective grants.
- There is no `DocumentGrant`, `BoardPackRecipient`, or equivalent authorization table.

## Security Requirements

### Authentication and Session

The viewer must require:

- Authenticated, MFA-verified session.
- Non-expired session.
- Active user status.
- Non-revoked session.
- Trusted or conditionally trusted device depending on confidentiality level.
- Fresh authorization decision for highly confidential materials.

Current code to extend:

- `lib/auth.ts`
- `app/(platform)/documents/[id]/page.tsx`
- `app/(platform)/board-packs/[id]/page.tsx`
- read/ack API routes.

### Authorization

Before rendering document content, the server must evaluate:

- User role.
- User committee membership.
- Document confidentiality.
- Document status and final lock.
- Document access expiry.
- Active access request approval, if required.
- Board-pack recipient assignment, if opened through a board pack.
- Meeting/agenda assignment.
- Device status.

Proposed production authorization helper:

- New `lib/document-access.ts`.
- Function: `canViewDocumentContent(auth, document, context)`.
- Function: `canAcknowledgeDocument(auth, document, context)`.
- Function: `canViewBoardPack(auth, boardPack)`.
- Function: `explainDocumentAccessDenial(...)` for auditable denial reasons.

Access denial should:

- Not render protected content.
- Show a user-safe reason.
- Offer `RequestAccessButton` when applicable.
- Write an audit event for denied attempts on restricted or higher materials.

### Confidentiality Rules

Recommended baseline:

- `PUBLIC`: authenticated users can view metadata; content may be broadly visible if policy allows.
- `INTERNAL`: authenticated BCB users can view unless restricted by module.
- `RESTRICTED`: assigned users, related committee members, Secretary/Chairman/Admin, or approved access grant.
- `CONFIDENTIAL`: board-pack recipients, explicitly assigned users, Secretary/Chairman/Admin, or approved access grant.
- `HIGHLY_CONFIDENTIAL`: explicit grants only; require trusted device and short expiry; Admin access should be confirmed by policy.

Decision required:

- Whether `SYSTEM_ADMIN` can read all protected content by default or only manage access controls.

### Device Controls

Current:

- `DeviceStatus` is `TRUSTED`, `UNTRUSTED`, or `REVOKED`.
- Viewer and APIs block only `REVOKED`.

Production:

- `REVOKED`: always blocked.
- `UNTRUSTED`: allow metadata only, or allow low-confidentiality content after step-up verification.
- `TRUSTED`: eligible for content rendering.
- Device management actions must remain Admin-only and audit logged.

### File Safety

Upload API must add server-side checks:

- MIME type detection by content, not only file extension.
- File size limits by type.
- Extension allowlist.
- Malware scanning hook.
- Checksum calculation.
- Storage key generation independent of original filename.
- Original filename retained only as metadata.
- Rejection of executable or polyglot files.

Required schema support:

- `FileObject` or equivalent model with storage key, checksum, MIME type, size, scan status, encryption metadata, and conversion status.

### Rendering Safety

Production viewer should not expose direct file paths.

Recommended rendering pipeline:

1. Upload original file to private storage.
2. Scan file.
3. Convert supported document types to page images or safe PDF pages.
4. Store rendered pages in private object storage.
5. Serve pages through short-lived, authenticated render endpoints.
6. Apply server-side watermark to rendered pages where possible.
7. Record page view events.

Do not render raw Office documents in browser if the file can contain active content.

Supported file types should be explicitly defined:

- PDF
- PNG/JPEG for scanned pages
- DOC/DOCX after conversion
- XLS/XLSX after conversion or preview extraction

### Watermarking

Current watermark is client-side HTML text.

Production watermark should include:

- User name.
- User role.
- User ID or employee ID.
- Date/time with timezone.
- Device ID.
- IP address.
- Document ID.
- Board pack ID if applicable.
- Session/viewer event ID.

Recommended:

- Server-side watermark rendered into page images/PDF previews.
- Client-side overlay may remain as an additional deterrent.
- Avoid exposing session token fragments in watermark; use viewer session ID instead.

### Event Logging

Current logged events:

- `DOCUMENT_READ`
- `DOCUMENT_ACKNOWLEDGED`
- `BOARD_PACK_ACKNOWLEDGED`
- access requested/approved/rejected

Missing events:

- Viewer opened.
- Page viewed.
- Access denied.
- Revoked/untrusted device blocked.
- Print/copy/save/context-menu attempt.
- Focus lost/visibility hidden while viewing protected content.
- Download attempted, if downloads are ever supported.
- Render token issued.
- Render token expired or reused.

Current component says blocked actions are logged, but blocked shortcut/context-menu events are not sent to the server. This should be corrected in production.

### Acknowledgment Rules

Current:

- Duplicate read/ack rows can be created.
- Acknowledgment is a generic `ReadAcknowledgment` row.

Production:

- Prevent duplicate acknowledgments for the same user/document/board pack/version.
- Acknowledgment should include document version and board-pack version.
- Acknowledgment should require that the user has opened or viewed required pages.
- Acknowledgment should be immutable and audit logged.
- Acknowledgment should remain valid even if document title or metadata later changes.

Required schema additions:

- Unique constraints or dedicated acknowledgment model.
- Version fields.
- Optional statement text accepted by user.

## Proposed Data Model Additions

### FileObject

Purpose: durable file metadata and storage reference.

Fields:

- `id`
- `documentId`
- `versionId`
- `storageProvider`
- `storageKey`
- `originalFileName`
- `mimeType`
- `sizeBytes`
- `sha256`
- `encryptionKeyRef`
- `virusScanStatus`
- `virusScanAt`
- `conversionStatus`
- `createdById`
- `createdAt`

### DocumentGrant

Purpose: effective document access grants.

Fields:

- `id`
- `documentId`
- `userId`
- `grantedById`
- `sourceType`: manual, access request, board pack, committee, role policy
- `sourceId`
- `canView`
- `canAcknowledge`
- `expiresAt`
- `revokedAt`
- `createdAt`

### BoardPackRecipient

Purpose: users assigned to a board pack.

Fields:

- `id`
- `boardPackId`
- `userId`
- `roleAtPublish`
- `assignedById`
- `assignedAt`
- `removedAt`

### ViewerSession

Purpose: track each protected viewing session.

Fields:

- `id`
- `userId`
- `sessionId`
- `deviceId`
- `documentId`
- `boardPackId`
- `ipAddress`
- `browser`
- `startedAt`
- `endedAt`
- `accessDecision`
- `denialReason`

### ViewerEvent

Purpose: page views and blocked actions.

Fields:

- `id`
- `viewerSessionId`
- `eventType`
- `page`
- `metadataJson`
- `createdAt`

### DocumentRenderJob and DocumentPageImage

Purpose: conversion and safe page delivery.

Fields:

- `DocumentRenderJob`: document version, status, error, started/completed timestamps.
- `DocumentPageImage`: page number, storage key, dimensions, checksum, render version.

## Required API Changes

Existing APIs to update:

- `POST /api/documents/[id]/read`
  - Verify content access.
  - Verify device policy.
  - Record viewer session/page context.
  - Deduplicate read rows or store page-level events.

- `POST /api/documents/[id]/acknowledge`
  - Verify content access.
  - Verify required read/page view criteria.
  - Store version-aware acknowledgment.
  - Prevent duplicate acknowledgment.

- `POST /api/board-packs/[id]/acknowledge`
  - Verify board-pack recipient/access.
  - Store board-pack version-aware acknowledgment.
  - Prevent duplicate acknowledgment.

- `POST /api/access-requests/create`
  - Validate duplicate pending/active requests.
  - Enforce requestable confidentiality levels.
  - Require reason length and duration bounds.

- `POST /api/access-requests/[id]/decision`
  - On approval, create effective `DocumentGrant`.
  - On rejection/revocation, revoke/avoid grant.
  - Confirm who can approve highly confidential requests.

- `POST /api/documents/upload`
  - Add file validation, scanning, storage metadata, and render job creation.

New APIs recommended:

- `GET /api/documents/[id]/pages`
  - Returns authorized page manifest, not raw storage paths.

- `GET /api/documents/[id]/pages/[page]`
  - Streams authorized rendered page with short-lived checks.

- `POST /api/viewer/events`
  - Records blocked actions, focus changes, page views, and viewer lifecycle events.

- `POST /api/documents/[id]/grants`
  - Admin/Secretary grant management.

- `POST /api/board-packs/[id]/recipients`
  - Board-pack recipient assignment.

## Required Page and Component Changes

Documents:

- `app/(platform)/documents/[id]/page.tsx`
  - Fetch access decision.
  - Render denial/request state before `SecureViewer`.
  - Pass viewer session ID and page manifest.

- `components/secure-viewer.tsx`
  - Render actual page images or safe previews.
  - Use viewer session ID, not session token slice.
  - Send viewer events to server.
  - Support page navigation.
  - Support required-read state before acknowledgment.
  - Keep no-download/no-print UI posture.

Board packs:

- `app/(platform)/board-packs/[id]/page.tsx`
  - Verify recipient access.
  - Support selecting agenda documents, not only first document.
  - Persist private notes/bookmarks.

Upload:

- `components/document-upload-form.tsx`
  - Add file validation UX.
  - Show scan/conversion state.

Access requests:

- `components/request-access-button.tsx`
  - Accept user-entered reason and duration.
  - Disable when active request/grant exists.

## Viewer UX Requirements

Minimum production UX:

- Clear access state: granted, pending request, denied, expired, revoked device.
- Page navigation and current page indicator.
- Persistent watermark visible on every page.
- Required acknowledgment statement.
- Read completion indicator.
- Version and confidentiality visible.
- No direct file URL or download button for restricted content.
- Graceful failure when render pages are not ready.
- Audit-visible warning when device is untrusted/revoked.

Board-pack UX:

- Agenda sidebar with all agenda items.
- Per-document read status.
- Per-pack acknowledgment status.
- Private notes and bookmarks saved per user.
- Publication history from persisted events, not only `historyJson`.

## Security Weaknesses in Current Viewer

- Access request approval does not control rendering.
- Any authenticated non-revoked device can open `/documents/[id]` if the ID is known.
- Read/ack APIs do not verify document grants.
- Uploaded file content is not displayed, scanned, encrypted, or protected through streaming.
- Client-side shortcut blocking can be bypassed.
- Client-side watermark can be removed by browser dev tools.
- Session token slice is exposed in watermark.
- Duplicate acknowledgment records are possible.
- Viewer blocked actions are not server-audited despite UI text.
- Board-pack detail only renders the first document by default.

## Features Already Present and Reusable

Do not duplicate:

- `SecureViewer` shell and visual layout.
- `ReadAcknowledgment` model as the current base for read/ack evidence.
- `createAuditLog()` for audit writing.
- `RequestAccessButton` and access request APIs as workflow base.
- `BoardPackAckButton` and pack acknowledgment API.
- `StatusBadge`, `Badge`, `Button`, and `PageShell`.
- `Document.filePath`, `fileName`, `version`, `confidentiality`, `isFinalLocked`, `accessExpiryDate`, and `simulatedOcrText` fields as migration starting points.

## Acceptance Criteria for Production Viewer

Access control:

- Unauthorized users cannot render protected content even with direct URLs.
- Expired access requests do not grant content access.
- Revoked devices cannot render or acknowledge content.
- Untrusted devices follow confirmed policy.
- Board-pack documents require board-pack recipient assignment or explicit override.

Storage/rendering:

- Raw files are private and never served from public paths.
- Every uploaded file has MIME type, checksum, size, scan status, and storage metadata.
- Rendered pages are served only through authorized endpoints.
- Rendered pages include server-side watermarking for restricted and higher content.

Audit:

- Viewer open, page view, denied access, read, acknowledgment, and blocked action events are audit logged.
- Audit entries include user, role, device, IP, session/viewer session, document, and result.
- Acknowledgments are version-aware and duplicate-safe.

UX:

- Users can understand why access is denied and request access when allowed.
- Directors can navigate board-pack agenda documents.
- Acknowledgment only becomes available when required viewing criteria are met.

Testing:

- Unit tests for document access decisions.
- API tests for direct unauthorized access attempts.
- Viewer tests for revoked/untrusted device behavior.
- Tests for duplicate acknowledgment prevention.
- Tests for access request expiry enforcement.

## Implementation Order

1. Add document access decision helper and tests.
2. Enforce access decisions in document and board-pack pages.
3. Enforce access decisions in read/ack APIs.
4. Make access request approvals create effective grants.
5. Add duplicate-safe/version-aware acknowledgment.
6. Add file metadata model and secure upload validation.
7. Add protected page rendering APIs.
8. Upgrade `SecureViewer` to render page previews.
9. Add server-audited viewer events.
10. Add board-pack recipient, notes, bookmarks, and multi-document navigation.

## Decisions Requiring Confirmation

- Can System Admin view all confidential document content, or only manage access/security?
- Is Chairman allowed to approve all restricted access requests, or only board-level requests?
- Which confidentiality levels require trusted devices?
- Should highly confidential documents require step-up MFA for every viewing session?
- Which file types are allowed in production?
- Should source files ever be downloadable by any role?
- Should watermark include IP address and device ID for all content or only restricted and above?
- What is the required retention period for read/ack/viewer events?
- Should board-pack acknowledgment require every document to be read first?
