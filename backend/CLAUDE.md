# Backend conventions (Django + DRF)

Inherits all rules from root `CLAUDE.md`. This file adds backend-specific
guidance. When in doubt, read the root file first.

## Project structure

The Django project will be created in week 3. Expected structure:

- `manage.py` — Django entry point
- `openpip/` — Django project package (settings, root urls, wsgi/asgi)
- `proteins/`, `interactions/`, `datasets/`, `admin_panel/` — Django apps,
  one per major domain area
- `core/` — shared utilities (auth, permissions, parsers, common serializers)
- `tests/parity/` — integration tests that compare against legacy openpip.usask.ca

Each Django app holds: `models.py`, `serializers.py`, `views.py`, `urls.py`,
`admin.py`, `tests/test_models.py`, `tests/test_views.py`, `tests/test_serializers.py`.

## Settings

- Use `django-environ` for env vars. No hardcoded secrets, URLs, or paths.
- Settings split: `settings/base.py`, `settings/dev.py`, `settings/prod.py`.
  Pick via `DJANGO_SETTINGS_MODULE`.
- `DEBUG = False` in everything except `dev.py`.
- `ALLOWED_HOSTS` driven by env var.

## Models

- Class names PascalCase. Table names snake_case via `Meta.db_table` to
  match legacy. **Never rename a legacy table or column** in Phase 1.
- Add `__str__` returning a human-readable identifier (gene symbol, dataset
  name, etc.).
- Use `related_name` on every ForeignKey and ManyToManyField.
- Index frequently-queried fields (`gene_name`, `uniprot_id`, etc.).
- Migrations are immutable once merged. Add new migrations to fix mistakes.

## Serializers

- One serializer per model output shape. Don't reuse a serializer across
  list/detail/nested contexts unless the shape is genuinely identical.
- Naming: `ProteinListSerializer`, `ProteinDetailSerializer`,
  `ProteinNestedSerializer` (for embedded contexts).
- Use `SerializerMethodField` only when ORM annotations can't do the job.
- Validate at the serializer layer, not in views.

## Views

- Prefer `ViewSet` + `Router` for CRUD endpoints. Use `APIView` for one-off
  endpoints (search, upload, export).
- Permissions on every view. Default to `IsAuthenticated`; explicitly mark
  `AllowAny` where needed (search, public protein detail).
- Pagination via DRF cursor pagination, default page size 50.
- Filtering via `django-filter` for query params.

## Tests

- pytest + pytest-django. No Django `TestCase` unless transactions are
  required.
- Fixtures via pytest fixtures or factory_boy. Never load `dev10.0_huri.sql`
  in tests — too large. Use small synthetic fixtures.
- Parity tests in `tests/parity/` may be marked `@pytest.mark.slow` and
  excluded from default runs. CI runs them separately.
- Coverage target: 80% on models, serializers, views, parsers.

## Parsing legacy data

The Phase 1 PSI-MI TAB parser must match the behavior of
`migration/legacy-uploader-reference/uploader.py`. Read that file before
writing the new parser. Capture its row-handling, identifier resolution,
and error semantics. Match them.

## Async and Celery

Phase 1 is synchronous. Do not introduce Celery in Phase 1.
Phase 2 introduces Celery + Redis for imports >10K interactions.

## Common gotchas

- Django auto-pluralizes `Meta.verbose_name_plural`; legacy table names
  may not pluralize cleanly (`admin_settings` is plural already). Set
  `verbose_name_plural` explicitly to avoid "admin_settingss".
- `inspectdb` generates `managed = False`. Flip to `managed = True` after
  cleanup, otherwise migrations won't track schema changes.
- Postgres is case-sensitive in string comparisons by default. If a parity
  test fails on case, check the legacy MySQL collation — likely
  `utf8_unicode_ci` (case-insensitive). Use Postgres `ILIKE` or `CITEXT`.
