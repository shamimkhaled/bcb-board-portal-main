# QA Release Gate

`npm run qa:release-gate` validates Prisma, TypeScript, production build, and the complete Chromium desktop suite. Any failed critical/high test returns non-zero. Explicitly blocked critical workflows make the generated recommendation **NOT READY**, even when executable tests pass.
