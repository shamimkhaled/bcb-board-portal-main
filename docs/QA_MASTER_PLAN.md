# QA Master Plan

The QA system uses a disposable SQLite database, deterministic fixtures, Playwright browser tests, Prisma integration checks, and a fail-closed release gate. Tests are grouped into smoke, meetings, documents, permissions, and full suites. Missing application capabilities are recorded as blocked tests rather than silently omitted.

Critical release paths are login, Secretary meeting creation, agenda save, submission and filtering, Chairman decision, publication, notification delivery, authorization, secure viewing, auditing, Prisma validation, TypeScript, and production build.
