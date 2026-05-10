# Legacy Schema Provenance

Two SQL files preserved here for migration reference. They are **independent
database dumps**, not snapshots of the same database at different times.

## `openpip.sql` (33 KB, 38 tables, schema-only)

- **Source path on legacy host**: `~/openPIP/openpip.sql` (top level of legacy
  repo at `~/openPIP/`). Byte-identical duplicate also existed at
  `~/openPIP/Docker OpenPIP package/openpip.sql`.
- **Origin**: phpMyAdmin SQL export (version 4.9.2)
- **Generated**: June 7, 2021
- **Source server**: MariaDB 10.4.10, PHP 7.3.12
- **Database name**: `openpip`
- **Contents**: schema only (CREATE TABLE statements), no INSERT data
- **Role in live deployment**: Not loaded automatically. `docker-compose.yml`
  uses the stock `mysql:8.0.0` image with no init scripts wired in. The
  `Dockerfile-mysql` block that would COPY `./db/.` to
  `/docker-entrypoint-initdb.d` is commented out.
- **Role for migration**: Clean schema reference — useful for understanding
  table structure without 143MB of HuRI data noise.

## `dev10.0_huri.sql` (143 MB, schema + production data)

- **Source path on legacy host**: `~/openPIP/Docker OpenPIP package/dev10.0_huri.sql`
- **Origin**: `mysqldump` from a MySQL 8.0.0-dmr server
- **Generated**: timestamp not preserved in dump
- **Source server**: localhost (the running production MySQL container)
- **Database name**: `huri`
- **Contents**: schema + all production data, including the live admin_settings
  row pointing to `https://openpip.usask.ca/` with full HuRI homepage HTML
- **Role in live deployment**: PRIMARY data source. Loaded manually via
  `populate_db.sh`, which `docker cp`s this file into the running mysql:8.0.0
  container and opens an interactive shell for
  `mysql -uroot -psecret huri < /dev10.0_huri.sql`.
- **Role for migration**: AUTHORITATIVE source of truth. Use this file's
  schema and data shape as the migration target.
- **Excluded from git** (see `../../.gitignore`) due to size.

## How the live deployment actually loads data

1. `docker-compose up` brings up `mysql:8.0.0` with empty database `huri` and
   the PHP/Symfony web container.
2. Operator manually runs `populate_db.sh`, which finds the mysql container,
   copies `dev10.0_huri.sql` into it, and shells in.
3. Operator runs `mysql -uroot -psecret huri < /dev10.0_huri.sql` from within
   the container to populate schema and data.

This is a manual one-shot setup, not an automated init flow.

## Migration implications

For week 19 (data migration script):

1. **Schema source of truth**: `dev10.0_huri.sql` (database `huri`),
   not `openpip.sql` (database `openpip`).
2. **Schema diff to investigate**: The two dumps come from different MySQL
   engines (MariaDB 10.4 vs MySQL 8.0.0) and different databases (`openpip`
   vs `huri`). Before writing the migration script, run a structured diff
   between the schema sections of both files to identify any drift between
   the canonical 2021 phpMyAdmin export and the 2025+ production MySQL dump.
3. **Engine compatibility note**: MariaDB 10.4 and MySQL 8.0.0 differ on
   `utf8_unicode_ci` collation handling. Migration script must handle both
   sources gracefully.
4. **Table count check**: `openpip.sql` declares 38 tables. Verify
   `dev10.0_huri.sql` matches with:
   `grep -c "^CREATE TABLE" dev10.0_huri.sql`
   If counts differ, document which tables are unique to which dump.

## Note on proposal accuracy

The GSoC proposal states "25+ MySQL tables" — actual count from `openpip.sql`
is 38. Update proposal narrative or week-3 documentation to reflect the
correct number.
