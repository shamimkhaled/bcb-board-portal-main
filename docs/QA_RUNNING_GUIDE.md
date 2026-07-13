# Running QA

Prerequisites: Node dependencies and Playwright Chromium (`npx playwright install chromium`).

```text
npm run qa:setup
npm run qa:smoke
npm run qa:meetings
npm run qa:documents
npm run qa:permissions
npm run qa:full
npm run qa:release-gate
npm run qa:report
```

Artifacts are written under `tests/reports/`. The runner starts an isolated app on port 3015 and refuses unsafe database names.
