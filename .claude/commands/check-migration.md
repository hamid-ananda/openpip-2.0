---
description: Verify a Django migration is parity-safe and applies cleanly.
---

Check that the most recent (or specified) Django migration is safe for
Phase 1 parity and applies cleanly to a fresh database.

Steps:

1. **Identify the migration**: If `$ARGUMENTS` is provided, treat it as
   a migration name (e.g., `proteins.0003_add_index`). Otherwise, find
   the most recent migration file in `backend/*/migrations/`.

2. **Read the migration file**. Look for parity violations per
   `docs/DATA_MODEL.md` rules:
   - `RenameModel` → flag (NOT allowed in Phase 1 unless it preserves
     `db_table`).
   - `RenameField` → flag (NOT allowed in Phase 1).
   - `RemoveField` → flag (NOT allowed in Phase 1 — column drops banned).
   - `DeleteModel` → flag (NOT allowed in Phase 1 — table drops banned).
   - `AlterField` changing the column name → flag.
   - `AddIndex` → fine (allowed in Phase 1).
   - `AddField` → review case-by-case (legacy schema must already have
     this column for parity; if it's a new column, flag for Phase 2).

3. **Apply to a fresh database** (advisory; do not run if the user has
   not provided test DB credentials):
   - `python manage.py migrate --run-syncdb` against a throwaway DB.
   - Report whether the migration applied without errors.

4. **Output**:
   - List any parity violations with the line of the migration and the
     reason it violates Phase 1 rules.
   - If clean, report: "Migration X is parity-safe and applies cleanly."

Do not modify the migration. This command only inspects and reports.

Arguments: `$ARGUMENTS` — optional migration name (e.g., `proteins.0003_add_index`).
