---
description: Run all tests across backend and frontend with clear reporting.
---

Run the full test suite and report results clearly.

Steps:

1. **Backend tests**: From `backend/`, run `pytest` with verbose output.
   Capture pass/fail count and any failures.
2. **Frontend tests**: From `frontend/`, run `npm run test`.
   Capture pass/fail count and any failures.
3. **Parity tests** (only if `$ARGUMENTS` includes "parity" or "all"):
   From `backend/`, run `pytest tests/parity/ -m slow`.
   These hit the live legacy openpip.usask.ca, so they're slow and
   excluded from the default run.

Reporting:

- If everything passes, summarize: "Backend: N passed. Frontend: N passed."
  (Add parity line if it ran.)
- If anything fails, list each failure with file path, test name, and
  the assertion message. Do not just dump the full pytest output.
- If a test suite cannot run (missing deps, unscaffolded project),
  say so explicitly rather than reporting it as a pass.

Do not modify any code or test files. This command only runs and reports.

Arguments: `$ARGUMENTS` — pass "parity" or "all" to include parity tests.
