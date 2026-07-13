# QA Test Data

- Database: `prisma/qa-test.db`
- Run identifier: generated as `QA-YYYYMMDDHHMMSS`
- Password: QA-only value stored in `.env.test` fixtures, never the development seed password.
- Users: System Admin, Company Secretary, Board Chairman, Director, Committee Member, Department User, Archive User, and Auditor.
- CEO coverage is blocked because the Prisma role does not exist.

`qa:setup` force-resets only a URL containing `qa` or `test` while `NODE_ENV=test`. Deterministic records carry the active run ID.
