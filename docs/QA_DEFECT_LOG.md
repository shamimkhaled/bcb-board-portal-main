# QA Defect Log

| Severity | Role | Workflow | Defect |
|---|---|---|---|
| CRITICAL | Chairman/Secretary | Meeting approval | Return and approval endpoints/UI are absent. |
| CRITICAL | Secretary/Recipients | Publication | Meeting publication, immutable agenda version and recipient snapshots are absent. |
| HIGH | CEO | Authorization | `CHIEF_EXECUTIVE_OFFICER` is absent from the Prisma role enum. |
| HIGH | Secretary/Chairman | Meeting lists | Returned, Approved and Archived tabs are absent. |
| HIGH | Secretary/Recipients | Board packs | Assembly, revision/version and recipient snapshot workflows are absent. |
| HIGH | All recipients | Notifications | Idempotency and several transition/reminder producers are absent. |
| MEDIUM | Archive User | Archive | Import/QC/final-lock mutations are absent. |
| MEDIUM | Governance roles | Minutes/actions | Required mutation endpoints are absent. |
| HIGH | All users | Authentication/audit | Concurrent logins can race `AuditLog.sequence`, producing an HTTP 500. Reproduced by the initial two-worker smoke run. |
