---
description: Run linters and formatters across backend and frontend.
---

Run all linters and formatters in check mode (no auto-fix unless asked).

Steps:

1. **Backend** (from `backend/`):
   - `ruff check .`
   - `black --check .`
2. **Frontend** (from `frontend/`):
   - `npm run lint` (eslint + prettier check)

Reporting:

- If everything is clean, report "All linters pass."
- For each violation, show: file path, line number, rule, and message.
- Group by tool (ruff/black/eslint/prettier) so it's easy to scan.
- Do NOT auto-fix unless `$ARGUMENTS` contains the word "fix". If "fix"
  is present, run the auto-fix versions:
  - `ruff check . --fix`
  - `black .`
  - `npm run lint -- --fix`
  Then re-run the check pass and report.

Arguments: `$ARGUMENTS` — pass "fix" to auto-fix where possible.
