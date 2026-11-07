---
name: systemiq-verify
description: Run the full SystemIQ verification suite (tests, types, lint, build, e2e) and report results. Use before finishing any task in this repo.
---
1. cd backend && npm test
2. cd frontend && npm run lint && npx tsc -b && npm test && npm run build
3. If frontend/e2e exists: cd frontend && npx playwright test
4. If any step fails, fix it (only within the task's scope) and rerun.
5. Report a table of step -> pass/fail, with failing output excerpts.
skip steps whose scripts don't exist yet and say so
