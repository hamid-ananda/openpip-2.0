# Migration directory

Inherits all rules from root `CLAUDE.md`. This file adds migration-specific
guidance.

## What lives here

- `legacy-schema/` — MySQL dumps from legacy openPIP. See `PROVENANCE.md`.
- `legacy-uploader-reference/` — original Python uploader. Read-only ref.
- `legacy-docker-reference/` — original Docker setup. Read-only ref.
- `scripts/` (created when needed) — Python migration scripts that read
  legacy MySQL and populate new Postgres.

## When to use this directory

- **Week 3**: generate Django models from legacy schema via `inspectdb`.
- **Week 19**: write the data migration script that ports actual rows from
  legacy MySQL → new Postgres.
- **Throughout**: reference legacy schema and uploader behavior to ensure
  parity in the new code.

## Reference files are read-only

Files under `legacy-uploader-reference/` and `legacy-docker-reference/`
are exact copies of legacy code preserved for behavioral reference.
Do not modify them. If something needs improvement, build it in
`backend/` or new scripts under `migration/scripts/`, not here.

## Migration script conventions (week 19)

When writing the MySQL → Postgres migration script:

- Idempotent. Running it twice produces the same result. Use upserts or
  truncate-and-load patterns.
- Resumable. If it fails halfway, restart picks up where it left off.
- Logged. Every batch reports rows processed, errors, and timing.
- Batched. Insert in chunks of 1000–10000 rows, not row-by-row.
- Configurable via env vars or argparse, not hardcoded.

## Loading the legacy schema for inspection

The 143MB `dev10.0_huri.sql` is gitignored but lives on disk at
`migration/legacy-schema/dev10.0_huri.sql`. To inspect it locally:

1. Spin up a throwaway MySQL 8.0 container, NOT the production one.
2. Pipe the SQL in via `docker exec -i <container> mysql ... < dev10.0_huri.sql`.
3. Use this temporary instance for `inspectdb` and exploration.
4. Tear it down when done. Never share its port with the host.

The production MySQL (`mysql8` container under `~/openPIP/`) is off-limits
for this work.

## Type translation reference

See `docs/DATA_MODEL.md` for the MySQL → PostgreSQL type translation table.


## Reading legacy openPIP

The Filesystem MCP is scoped to `~/openpip-2.0/` only. Claude Code's
Roots protocol overrides any `.mcp.json` argv pointing outside the
project workspace, and symlinks resolving outside are also blocked
by the MCP's security guard.

This means MCP-level tree views, batch reads, and metadata listings
do not work on `~/openPIP/`.

For legacy reads, use Claude Code's built-in tools instead:

- The `Read` tool reads any file Claude can access on disk, including
  legacy. Example: `Read ~/openPIP/data-upload/uploader.py`.
- The `Bash` tool with `ls`, `cat`, `grep`, `find`, etc. — these are
  in the allow list (`.claude/settings.json`) and work on legacy.
- Legacy reference snapshots already in this `migration/` directory
  (legacy-schema/, legacy-uploader-reference/, legacy-docker-reference/)
  are inside the workspace and ARE accessible via the Filesystem MCP.

The read-only-on-legacy policy is unchanged. Three layers prevent writes:
- `.claude/settings.json` denies `Write(~/openPIP/**)` and `Edit(~/openPIP/**)`
- The pre-commit hook regex blocks any commit touching legacy paths
- The CLAUDE.md non-negotiables section
