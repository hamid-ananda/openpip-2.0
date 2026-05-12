#!/usr/bin/env python3
"""
One-time migration: legacy MySQL (mysql8 Docker container) → 2.0 Postgres.

Usage:
    python migration/migrate_legacy.py [--reset]

    --reset   Truncate all target tables before inserting (for re-runs during dev).
              Default: fail loudly on duplicate PKs.

Prerequisites:
    - docker compose up -d db  (2.0 Postgres running, port 5432 exposed to host)
    - python manage.py migrate  (Django tables created)
    - pip install -r migration/requirements.txt
    - DATABASE_URL in ~/openpip-2.0/.env
"""
import argparse
import io
import os
import subprocess
import sys

import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

MYSQL_CONTAINER = 'mysql8'
MYSQL_USER = 'root'
MYSQL_PASS = 'secret'
MYSQL_DB = 'huri'

# Tables in dependency order (parents before children)
# Skip: user (FOSUserBundle format), fos_group, fos_user_user_group, test_table
TABLES = [
    'admin_settings',
    'announcement',
    'annotation_type',
    'organism',
    'protein',
    'identifier',
    'protein_identifier',
    'protein_organism',
    'protein_isoform',
    'interaction_category',
    'interaction',
    'dataset',
    'interaction_dataset',
    'interaction_interaction_category',
    'domain',
    'interaction_domain',
    'complex',
    'complex_protein',
    'annotation',
    'annotation_protein',
    'annotation_interaction',
    'interaction_network',
    'interaction_interaction_networks',
    'support_information',
    'interaction_support_information',
    'data_file',
    'dataset_request',
    'dataset_request_dataset',
    'external_link',
]


def mysql_tsv(table: str) -> str:
    """Stream table from MySQL container as TSV (with header row)."""
    result = subprocess.run(
        [
            'docker', 'exec', MYSQL_CONTAINER,
            'mysql', f'-u{MYSQL_USER}', f'-p{MYSQL_PASS}', MYSQL_DB,
            '--batch', '--silent', '-e', f'SELECT * FROM `{table}`',
        ],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f'MySQL error on {table}: {result.stderr}')
    return result.stdout


def get_columns(table: str) -> list[str]:
    """Return column names for the table in ordinal order."""
    result = subprocess.run(
        [
            'docker', 'exec', MYSQL_CONTAINER,
            'mysql', f'-u{MYSQL_USER}', f'-p{MYSQL_PASS}', MYSQL_DB,
            '--batch', '--silent', '-e',
            f"SELECT COLUMN_NAME FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA='{MYSQL_DB}' AND TABLE_NAME='{table}' "
            f"ORDER BY ORDINAL_POSITION",
        ],
        capture_output=True, text=True,
    )
    return [c.strip() for c in result.stdout.strip().splitlines() if c.strip()]


def migrate_table(conn, table: str, reset: bool) -> int:
    columns = get_columns(table)
    if not columns:
        print(f'  {table}: no columns found, skipping')
        return 0

    tsv_data = mysql_tsv(table)
    lines = tsv_data.strip().splitlines()
    if len(lines) <= 1:
        print(f'  {table}: empty')
        return 0

    data_lines = lines[1:]  # skip header row
    row_count = len(data_lines)

    with conn.cursor() as cur:
        if reset:
            cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')

        # Disable FK triggers during bulk load
        cur.execute('SET session_replication_role = replica')

        buf = io.StringIO('\n'.join(data_lines))
        cur.copy_from(buf, table, columns=columns, null='\\N', sep='\t')

        cur.execute('SET session_replication_role = DEFAULT')

        # Reset sequence to avoid PK collisions on subsequent inserts
        if 'id' in columns:
            cur.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE(MAX(id), 1)) FROM \"{table}\""
            )

    conn.commit()
    return row_count


def main():
    parser = argparse.ArgumentParser(description='Migrate legacy MySQL data to Postgres')
    parser.add_argument('--reset', action='store_true',
                        help='Truncate tables before inserting (safe for dev re-runs)')
    args = parser.parse_args()

    db_url = os.environ.get('DATABASE_URL', 'postgres://openpip:openpip@localhost:5432/openpip')
    conn = psycopg2.connect(db_url)

    total_rows = 0
    failed = []

    for table in TABLES:
        try:
            rows = migrate_table(conn, table, reset=args.reset)
            print(f'  OK {table}: {rows} rows')
            total_rows += rows
        except Exception as exc:
            print(f'  FAIL {table}: {exc}')
            failed.append(table)
            conn.rollback()

    conn.close()

    print(f'\nDone. {total_rows} total rows migrated.')
    if failed:
        print(f'Failed tables: {failed}')
        sys.exit(1)


if __name__ == '__main__':
    main()
