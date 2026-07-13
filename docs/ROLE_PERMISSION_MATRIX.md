# BCB Paperless Role Permission Matrix

## Basis in Current Codebase

Roles are defined in `prisma/schema.prisma` as the `Role` enum:

- `SYSTEM_ADMIN`
- `COMPANY_SECRETARY`
- `BOARD_CHAIRMAN`
- `DIRECTOR`
- `COMMITTEE_MEMBER`
- `DEPARTMENT_USER`
- `ARCHIVE_USER`
- `AUDITOR`

Current helper functions in `lib/auth.ts`:

- `canUseSecretaryControls(role)`: allows `SYSTEM_ADMIN`, `COMPANY_SECRETARY`, and `BOARD_CHAIRMAN`.
- `canAdminister(role)`: allows `SYSTEM_ADMIN`.
- `canApproveAsChairman(role)`: allows `BOARD_CHAIRMAN` and `SYSTEM_ADMIN`.

Current platform route protection:

- `app/(platform)/layout.tsx` calls `requireAuth()`, so all platform pages require a valid authenticated session.
- Most pages do not currently enforce role-specific visibility.
- Some API mutations enforce role checks, especially memo approval, access request decision, and device status update.

## Current Authorization Observations

Implemented today:

- All platform pages require authentication.
- Memo Secretary transitions require `canUseSecretaryControls()`.
- Memo Chairman transitions require `canApproveAsChairman()`.
- Access request decisions require `canUseSecretaryControls()`.
- Device status changes require `canAdminister()`.
- Read/ack APIs reject revoked devices.

Missing today:

- Role-filtered navigation.
- Page-level role restrictions for Admin, Audit Logs, Reports, Backup & DR, Archive, etc.
- Route-level permission metadata.
- Document access enforcement based on confidentiality, committee, board-pack assignment, access request approval, and expiry.
- Field-level restrictions.
- Distinction between "can view list" and "can view protected document content".

## Proposed Permission Legend

- `V`: view page/list/metadata.
- `C`: create/register.
- `U`: update/edit.
- `A`: approve/reject/publish/lock.
- `D`: delete/revoke/archive where allowed.
- `Own`: scoped to records created by or assigned to the user.
- `Assigned`: scoped to committee, meeting, board pack, document grant, or action assignment.
- `Audit`: action must be audit logged.

## Proposed Route Matrix

| Route | Current protection | System Admin | Company Secretary | Board Chairman | Director | Committee Member | Department User | Archive User | Auditor | Notes |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/dashboard` | Auth only | V | V | V | V | V | V | V | V | Dashboard should be scoped by role and assignments. |
| `/memo-workflow` | Auth only, API partial | V/A | V/C/U/A | V/A | V Assigned | V Assigned | V/C Own | V metadata | V | Memo creation currently open to all authenticated users. |
| `/meetings` | Auth only | V | V/C/U/A | V/A | V Assigned | V Assigned | V limited | V limited | V | Page is read-only currently. |
| `/board-packs` | Auth only | V/A | V/C/U/A | V/A | V Assigned | V Assigned | V limited | V limited | V metadata | Publication workflow is missing. |
| `/board-packs/[id]` | Auth only | V/A | V/A | V/A | V Assigned/Ack | V Assigned/Ack | V limited | V limited | V metadata | Should require pack recipient or admin/secretary/chair grant. |
| `/documents` | Auth only | V/C/U/A | V/C/U/A | V/A | V Assigned | V Assigned | V/C Own | V/C/U Archive | V metadata | Upload exists but no role gate. |
| `/documents/[id]` | Auth only, revoked device block in viewer | V | V | V | V Assigned/Granted | V Assigned/Granted | V Own/Granted | V Archive | V Granted/Metadata | Must enforce grants before rendering content. |
| `/archive` | Auth only | V/A | V | V | V metadata | V metadata | V limited | V/C/U/A | V | Currently read-only. |
| `/minutes` | Auth only | V | V/C/U/A | V/A | V Assigned/Ack | V Assigned/Ack | V limited | V metadata | V | Currently read-only. |
| `/resolutions` | Auth only | V | V/C/U/A | V/A | V Assigned | V Assigned | V limited | V metadata | V | Currently read-only. |
| `/action-items` | Auth only | V | V/C/U/A | V/A | V Assigned/U Own | V Assigned/U Own | V Assigned/U Own | V Assigned/U Own | V | Currently read-only. |
| `/committees` | Auth only | V/C/U | V/C/U | V | V Assigned | V Assigned | V limited | V limited | V | Currently read-only. |
| `/access-requests` | Auth only, API partial | V/A | V/A | V/A currently | V Own | V Own | V Own | V Own | V | Current helper includes Chairman in Secretary controls. Confirm if desired. |
| `/notifications` | Auth only | V Own/U Own | V Own/U Own | V Own/U Own | V Own/U Own | V Own/U Own | V Own/U Own | V Own/U Own | V Own/U Own | Current page scopes by user. |
| `/reports` | Auth only | V | V | V | V limited | V limited | V limited | V archive reports | V | Needs report-specific scopes. |
| `/backup-dr` | Auth only | V/A | V | V | No/limited | No/limited | No | No/limited | V | Current page is visible to all authenticated users. |
| `/admin` | Auth only, device API admin only | V/C/U/A/D | No | No | No | No | No | No | V read-only optional | Page should be gated to Admin, maybe Auditor read-only. |
| `/audit-logs` | Auth only | V | V limited | V limited | No | No | No | No | V | Current page is visible to all authenticated users. |
| `/demo-journey` | Auth only | V | V | V | V | V | V | V | V | Should be removed or hidden in production. |

## Proposed API Matrix

| API route | Current behavior | Production permission |
|---|---|---|
| `POST /api/auth/login` | Public, password check, issues pending MFA cookie | Public with rate limiting, lockout, audit, bot protection. |
| `POST /api/auth/mfa` | Public with pending cookie, fixed OTP | Public with signed/server-side challenge, real MFA, rate limiting. |
| `POST /api/auth/logout` | Deletes current session if present | Authenticated session owner. |
| `POST /api/documents/upload` | Any authenticated user can upload | `documents:create`; likely Secretary, Archive User, Department User scoped, Admin. |
| `POST /api/documents/[id]/read` | Authenticated, rejects revoked device | `documents:viewContent` with active grant/assignment and device trust. |
| `POST /api/documents/[id]/acknowledge` | Authenticated, rejects revoked device | `documents:acknowledge` with active grant/assignment and device trust. |
| `POST /api/access-requests/create` | Any authenticated user can request | Authenticated user; prevent duplicates; validate reason/duration. |
| `POST /api/access-requests/[id]/decision` | Secretary controls: Admin, Secretary, Chairman | `accessRequests:decide`; confirm whether Chairman should decide all requests. |
| `POST /api/board-packs/[id]/acknowledge` | Authenticated, rejects revoked device | Assigned recipient only, or Admin/Secretary/Chair override. |
| `POST /api/devices/[id]/status` | System Admin only | `devices:manage`; Admin only, audit required. |
| `POST /api/memos/create` | Any authenticated user | `memos:create`; Department User, Secretary, Admin; maybe committee roles scoped. |
| `POST /api/memos/[id]/advance` | Submit open to auth; selected transitions restricted | `memos:submit`, `memos:secretaryReview`, `memos:chairmanApprove`; validate status order. |
| `POST /api/notifications/[id]/read` | Authenticated; expected own notification check should be confirmed | `notifications:updateOwn`; ensure user owns notification. |

## Functional Permission Groups

### Authentication and Session

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Sign in with MFA | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage own session | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| View own device/session status | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Manage all devices | Yes | No | No | No | No | No | No | Read-only optional |

### Documents

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View document metadata | All | All governance | All governance | Assigned/Granted | Assigned/Granted | Own/Granted | Archive scope | Audit scope |
| View protected content | All | Governance scope | Governance scope | Assigned/Granted | Assigned/Granted | Own/Granted | Archive scope | Granted/Audit scope |
| Upload/register document | Yes | Yes | Approve only | No | Scoped optional | Own department | Yes | No |
| Approve/final lock document | Yes | Yes | Yes for board docs | No | No | No | Archive lock only | No |
| Request restricted access | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Decide restricted access | Yes | Yes | Confirm | No | No | No | No | Read-only |
| Acknowledge/read assigned document | Yes | Yes | Yes | Yes | Yes | Yes if assigned | Yes if assigned | Yes if assigned |

### Memo Workflow

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Create memo | Yes | Yes | Optional | No | Scoped optional | Yes | No | No |
| Submit own memo | Yes | Yes | Optional | No | Scoped optional | Yes | No | No |
| Secretary review/return | Yes | Yes | Confirm current helper allows | No | No | No | No | No |
| Chairman approve/reject | Yes | No | Yes | No | No | No | No | No |
| Mark for board meeting | Yes | Yes | Optional | No | No | No | No | No |
| View memo history | Yes | Yes | Yes | Assigned | Assigned | Own | No | Yes |

### Board Packs and Meetings

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Create/edit meeting | Yes | Yes | Approve | No | Scoped optional | No | No | Read-only |
| Prepare agenda | Yes | Yes | Approve | No | Scoped optional | No | No | Read-only |
| Compile board pack | Yes | Yes | No | No | Scoped optional | No | No | No |
| Publish board pack | Yes | Yes | Approve optional | No | Scoped optional | No | No | No |
| View assigned board pack | Yes | Yes | Yes | Yes | Yes if assigned | No/limited | No/limited | Audit scope |
| Acknowledge pack | Yes if recipient | Yes if recipient | Yes if recipient | Yes | Yes if recipient | No/limited | No/limited | No |

### Minutes, Resolutions, Action Items

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Draft minutes | Yes | Yes | No | No | Scoped optional | No | No | No |
| Approve/return minutes | Yes | No | Yes | No | No | No | No | No |
| Lock minutes | Yes | Yes after approval | Yes | No | No | No | No | No |
| Generate resolutions | Yes | Yes | Yes approval | No | Scoped optional | No | No | Read-only |
| Publish resolutions | Yes | Yes | Yes approval | No | No | No | No | Read-only |
| Create/update action item | Yes | Yes | Yes | Own assigned status only | Own assigned status only | Own assigned status only | Own assigned status only | Read-only |
| Close action item | Yes | Yes | Yes approval | No | No | No | No | Read-only |

### Archive

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View archive dashboard | Yes | Yes | Yes | Metadata limited | Metadata limited | Limited | Yes | Yes |
| Create archive batch | Yes | No/optional | No | No | No | No | Yes | No |
| Update OCR/QC metadata | Yes | No/optional | No | No | No | No | Yes | Review only |
| Final lock archive record | Yes | Yes approval optional | No | No | No | No | Yes | No |

### Audit, Reports, Backup, Admin

| Permission | Admin | Secretary | Chairman | Director | Committee | Department | Archive | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| View audit logs | Yes | Limited | Limited | No | No | No | No | Yes |
| Verify audit chain | Yes | No | No | No | No | No | No | Yes |
| Export audit logs | Yes | No | No | No | No | No | No | Yes |
| View executive reports | Yes | Yes | Yes | Limited | Limited | Limited | Archive reports | Yes |
| View backup posture | Yes | Yes summary | Yes summary | No | No | No | No | Yes |
| Manage users/roles | Yes | No | No | No | No | No | No | No |
| Manage committees/setup | Yes | Yes | View/approve | No | No | No | No | Read-only |

## Current Features That Must Not Be Duplicated

Do not create competing implementations for:

- `requireAuth()` session gating.
- `createAuditLog()` and `verifyAuditChain()`.
- Role labels in `lib/labels.ts`.
- Navigation definitions in `lib/navigation.ts`; extend/filter these instead.
- Existing workflow components:
  - `MemoCreateForm`
  - `MemoActionButtons`
  - `DocumentUploadForm`
  - `SecureViewer`
  - `RequestAccessButton`
  - `AccessRequestControls`
  - `BoardPackAckButton`
  - `DeviceStatusControls`
  - `NotificationReadButton`
- Status/metric/panel components:
  - `PageShell`
  - `AppShell`
  - `MetricCard`
  - `StatusBadge`
  - `WorkflowTimeline`

## Required Implementation Files

Recommended new or changed files:

- New `lib/permissions.ts` for declarative permission checks.
- Update `lib/navigation.ts` to attach required permissions to each item.
- Update `components/app-shell.tsx` to receive filtered navigation or auth context.
- Update `app/(platform)/layout.tsx` to pass role-aware navigation.
- Add route-level authorization to all `app/(platform)/*/page.tsx` files.
- Add API authorization and ownership checks to all `app/api/*/route.ts` files.
- Add database migrations for formal permission and document grant models.

## Decisions Requiring Confirmation

- Should `BOARD_CHAIRMAN` keep `canUseSecretaryControls()` powers, or should Chairman approval be separate from Secretary operations?
- Should `AUDITOR` have full audit log access, read-only access to all business records, or only audit reports?
- Should `DIRECTOR` access all board packs by default or only assigned/published packs?
- Should `COMMITTEE_MEMBER` access only their committee packs and documents?
- Should `DEPARTMENT_USER` see only own submitted memos/documents/actions?
- Should `ARCHIVE_USER` be allowed to view protected document content or only archive metadata/OCR/QC fields?
- Who can approve highly confidential access requests?
- Should Admin be allowed to read all confidential content, or only manage access and security?
