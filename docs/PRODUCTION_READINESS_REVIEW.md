# BCB Paperless Production Readiness Review

Review date: 2026-07-10

Verdict: **Not production-ready for real BCB production use yet.**

The upgraded application now has a working permission engine, protected admin configuration, short-lived secure document-viewer sessions, server-derived forensic watermark context, audit logging, and a passing production build. However, critical production-readiness items remain: authentication still uses demo-grade password and OTP behavior, existing SQLite migration history is not safely baselined for automated production deploys, and the secure viewer currently renders simulated/extracted text pages rather than hardened, high-volume PDF page rendering.

## Passed Checks

1. Authentication and authorization
   - Authenticated sessions are required for platform routes.
   - Pending MFA cookies are now HMAC-signed and tamper-resistant.
   - `AUTH_SECRET` or `NEXTAUTH_SECRET` is now required at runtime in production for pending MFA cookie signing.
   - Role/action permissions, module visibility, widget visibility, document-category permissions, and user overrides are resolved server-side.

2. Insecure direct object reference risks
   - Document detail routes return not-found for unauthorized document IDs.
   - Secure viewer page/action APIs bind requests to authenticated user ID and auth session token.
   - Notification read API enforces notification ownership.
   - Admin configuration APIs target users by email and validate all submitted keys server-side.

3. Role and user override resolution
   - Permission resolution applies explicit deny precedence.
   - Tests cover role allow, user deny, and user allow/deny override behavior.
   - Admin UI identifies role inheritance vs user overrides.

4. Navigation and API consistency
   - Navigation is driven by module visibility.
   - Admin configuration page and APIs enforce server-side admin/manage permission.
   - Secure viewer APIs do not rely on client-side hiding.

5. Document access enforcement
   - Document metadata and content access checks are server-side.
   - Secure viewer sessions cannot be created without document authorization.
   - Direct document-route authorization denial is now audit logged.

6. Storage URL exposure
   - No permanent public file URL is exposed for uploaded files.
   - Uploaded files remain under workspace storage and are not served by a public static route.

7. Watermark trust boundary
   - Watermark context is generated server-side from authenticated user, role, document, timestamp, device, IP, and public trace ID.
   - Browser input does not supply identity fields.
   - Confidential board documents now force watermark enabled even if an override attempts to disable it.

8. Audit completeness
   - Audit logging exists for login success/failure, MFA failure, document view, direct document denial, secure viewer denied actions, expiry, device changes, upload, read, acknowledgment, memo workflow, access requests, and admin configuration changes.
   - Audit chain verification exists.

9. Session expiry
   - Auth sessions expire after 30 minutes.
   - Secure document view sessions expire after 10 minutes.
   - Expired secure view sessions return `410` and log expiry once.

10. Database indexes
   - Permission and visibility tables have unique constraints and lookup indexes.
   - `WatermarkPolicy` has role/category and user/category uniqueness.
   - `SecureDocumentViewSession` has indexes for document, user, and trace/session lookup.

11. Accessibility
   - Admin configuration uses keyboard-focusable controls and form labels.
   - Secure viewer exposes clear loading, expired, and error states.

12. Responsive layout
   - Dashboard/admin/viewer layouts use responsive grid/flex patterns.
   - Secure viewer page area scrolls within available viewport and lazy-loads pages.

13. Error and empty states
   - Admin config shows validation/error/success messages.
   - Secure viewer shows loading, expiry, and unavailable states.
   - User search handles no results.

14. Build, TypeScript, lint, and tests
   - `npm.cmd test` passed.
   - `npm.cmd run typecheck` passed.
   - `npm.cmd run lint` passed with no warnings.
   - `npm.cmd run build` passed.
   - `npx.cmd prisma validate` passed.

## Changes Made During This Review

- Signed the pending MFA cookie with HMAC in `lib/auth.ts`.
- Added production secret enforcement for `AUTH_SECRET` or `NEXTAUTH_SECRET`.
- Added `.env.example` documenting `DATABASE_URL` and `AUTH_SECRET`.
- Added direct document denial audit logging in `app/(platform)/documents/[id]/page.tsx`.
- Forced watermark enabled for confidential board documents in `lib/secure-document-viewer.ts`.
- Added `scripts/test-auth-security.ts` for MFA cookie tampering coverage.
- Extended secure viewer tests to verify watermark cannot be disabled for confidential board documents.
- Updated `npm test` to run auth security, permission, and secure viewer tests.

## Open Risks

Critical:
- Authentication remains demo-grade. Passwords use unsalted SHA-256, OTP is a hardcoded demo code, there is no login/MFA rate limiting, no account lockout, no password reset flow, and no integration with an enterprise IdP.
- Migration deployment is not production-safe yet for an existing database. The local SQLite DB is not baselined for `prisma migrate deploy`; previous migrations had to be applied with `prisma db execute`.
- Secure viewer does not yet render real large PDFs page-by-page. It currently renders simulated/extracted text pages. This is acceptable for an MVP demo, not for production board-paper review.

High:
- Several module pages use module visibility as the page gate but do not always check matching action permissions. APIs generally enforce action permissions, but page/action consistency should be audited route-by-route before production.
- Board-pack acknowledgment checks the `boardPacks:acknowledge` permission but does not verify the user is an attendee/recipient of the specific pack.
- Access-request creation allows a permitted user to request access to any document ID. That may be intended, but production should decide whether request visibility should require metadata access or an explicit requestable-document list.
- Uploaded file paths are absolute local filesystem paths in the database. They are not publicly exposed, but production should use encrypted object storage or encrypted private volume storage with key management.
- Audit logging is broad but not guaranteed for every unsuccessful module/page authorization denial.
- Admin changes are transactional per API request, but audit creation occurs after the transaction. A rare audit-write failure after data commit would leave a configuration change without audit.

Medium:
- The secure viewer action API audits denied download/print/share attempts, but there is no real permitted download/print implementation yet.
- Viewer lazy loading paginates text, not binary PDF page render output. Memory and performance characteristics for 100+ page PDFs are unproven.
- No CSRF token mechanism is present. SameSite=Lax helps, but production should add explicit CSRF protection for mutations.
- Session tokens are stored raw in the database. Production should store hashed session tokens.
- No centralized security headers policy is configured.
- The current `.env` only contains `DATABASE_URL`; production env validation should be centralized.
- Some older UI strings contain mojibake separator characters from prior seeded text.

## Deployment Checklist

Do not deploy to production until these are complete:

1. Replace demo authentication:
   - Use bcrypt/argon2id password hashes or SSO/IdP.
   - Replace hardcoded OTP with TOTP, email OTP, SMS OTP, or IdP MFA.
   - Add login and MFA rate limiting.
   - Add account lockout and session revocation.

2. Prepare production database:
   - Move from SQLite to the approved production database.
   - Baseline existing schema migration history.
   - Run migrations in staging with production-like data.
   - Verify rollback scripts for new tables and indexes.

3. Harden document storage:
   - Move uploaded documents to encrypted private object storage or encrypted private volume.
   - Do not expose bucket/object URLs directly.
   - Add malware scanning and file type validation.

4. Complete real PDF viewer:
   - Render PDFs server-side or through a controlled PDF rendering service.
   - Apply watermark to rendered page output.
   - Test large board packs and 100+ page PDFs.

5. Finish route authorization audit:
   - Map every page route to module and action permissions.
   - Map every API route to action permission and object ownership rules.
   - Add tests for IDOR-negative cases per workflow.

6. Security controls:
   - Add CSRF protection.
   - Add production security headers.
   - Store hashed session tokens.
   - Centralize env validation.
   - Configure `AUTH_SECRET` with at least 32 random bytes.

7. Operational readiness:
   - Configure structured logs.
   - Configure audit log retention and backup.
   - Configure database backups and restore tests.
   - Configure monitoring and alerting.

## Rollback Plan

1. Before deployment:
   - Take a full database backup.
   - Snapshot private document storage.
   - Save the deployed app artifact/version.

2. If deployment fails before schema migration:
   - Stop rollout.
   - Redeploy the previous app artifact.

3. If deployment fails after schema migration:
   - Put the app in maintenance mode.
   - Restore database backup if data integrity is affected.
   - If no data integrity issue exists, redeploy previous app artifact and leave additive tables unused.

4. If secure viewer has production issues:
   - Disable viewer entry points at routing or feature-flag level.
   - Preserve audit logs and view-session records for incident review.
   - Re-enable previous document metadata-only access while content rendering is fixed.

## Recommended Post-Production Monitoring

- Login failure and MFA failure rates by IP/user.
- Auth session creation, expiry, and revocation counts.
- Secure viewer session creation and expiry rates.
- Denied document view attempts by user/document/IP.
- Denied download/print/share attempts.
- Admin configuration changes by actor and affected role/user.
- Audit chain verification status.
- Database migration status and failed query rate.
- Document upload failures and file scan failures.
- PDF render latency, page-load latency, and memory usage.
- Top large documents by page count and render time.
- Storage access errors and private object read failures.

## Final Readiness Statement

The upgraded BCB Paperless application is in a stronger demo/staging state after this review. It passes build, lint, typecheck, and automated tests, and several important security issues were fixed directly.

It is **not production-ready** until the critical authentication, migration, and real PDF rendering/document-storage items above are completed and verified in staging.
