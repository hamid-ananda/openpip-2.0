# openPIP 2.0

Phased migration of openPIP from PHP 5.6 / Symfony 2.8 / MySQL to
Django 5 + DRF / PostgreSQL 16 / React 18 + TypeScript + Vite.

GSoC 2026 under NRNB. Mentors: Dr. Mohamed Helmy (VIDO), Dr. Gary Bader (UofT).
Original paper: Helmy et al., JMB 2022. Full strategy: `docs/MIGRATION_STRATEGY.md`.

## Non-negotiables

1. **Never touch `~/openPIP/`** — live production at openpip.usask.ca.
   Read for reference; never modify, stop containers, or write to its DB.
2. **Phase 1 is parity, not redesign.** Do not add features absent from
   legacy. Do not redesign the schema. UI may be modernized; behavior may not.
3. **TBD decisions are not yours to settle.** If a decision below is marked
   TBD, ask before choosing.
4. **Verify before claiming done.** See "Verification" below.

## Locked decisions

- Backend: Django 5 + DRF
- Database: PostgreSQL 16 (1:1 schema translation from legacy MySQL)
- Frontend: React 18 + TypeScript (`strict: false`) + Vite + React Router
- State: TanStack Query (server) + Zustand (client)
- Network viz: Cytoscape.js via react-cytoscapejs
- Auth: djangorestframework-simplejwt
- Async (Phase 2 only): Celery + Redis
- Deployment: Docker Compose, multi-container

## TBD — confirm with Dr. Helmy

- Container registry (Docker Hub / GHCR / self-hosted)
- WSGI vs ASGI server (Gunicorn sufficient for Phase 1; ASGI needed for Phase 2)
- Phase 2 feature priority order

## Common commands

All commands are scoped to `~/openpip-2.0/` only. Never run any container,
database, or compose command against `~/openPIP/` (production).

```bash
# Backend (run from backend/)
python manage.py runserver           # dev server
python manage.py migrate              # apply migrations
python manage.py makemigrations       # create migrations
python manage.py inspectdb            # generate models from existing DB
pytest                                # run tests
ruff check . && black --check .       # lint

# Frontend (run from frontend/)
npm run dev                           # dev server
npm run build                         # production build
npm run test                          # vitest
npm run lint                          # eslint + prettier check

# Full stack — ONLY in ~/openpip-2.0/, NEVER in ~/openPIP/
cd ~/openpip-2.0                      # always confirm directory first
docker compose up -d                  # start the 2.0 stack
docker compose logs -f backend        # tail backend logs
docker compose ps                     # see what's running
```

To stop the 2.0 stack, prefer `docker compose stop` (preserves containers)
over `docker compose down` (removes them). Visually similar commands against
the wrong directory have caused production outages in other projects; avoid
the habit.

## Verification — before claiming a task is done

1. Backend changes: `pytest` passes, `ruff check .` clean, `black --check .` clean.
2. Frontend changes: `npm run test` passes, `npm run lint` clean, `npm run build` succeeds.
3. Parity changes: run a parity test against legacy at openpip.usask.ca.
   See `docs/MIGRATION_STRATEGY.md` for the parity test protocol.
4. Schema changes: migration applies cleanly on a fresh database.
5. Never claim "done" with failing tests, lint errors, or unverified parity.

## Conventions

- **Python**: ruff + black, line length 100, type hints on public functions.
- **TypeScript**: eslint + prettier, `strict: false`, types on API responses.
- **SQL**: lowercase keywords, snake_case names (matching legacy).
- **Branches**: `feature/`, `fix/`, `docs/`, `migrate/<area>`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `migrate:`, `docs:`,
  `test:`, `chore:`, `refactor:`). Imperative mood.
- **Tests** colocated with source. Fixtures never >1MB.
- **Migrations** immutable once merged.
- **Never push to main directly.**

## Where to find more

Read deeper docs only when the task requires them.

| Topic | Document |
|---|---|
| Phase 1/2 strategy, parity testing | `docs/MIGRATION_STRATEGY.md` |
| Data model, type translation table | `docs/DATA_MODEL.md` |
| API endpoint catalog | `docs/API.md` |
| External standards & links | `docs/REFERENCES.md` |
| Backend conventions (Django) | `backend/CLAUDE.md` |
| Frontend conventions (React) | `frontend/CLAUDE.md` |
| Migration script conventions | `migration/CLAUDE.md` |
| Legacy SQL provenance | `migration/legacy-schema/PROVENANCE.md` |

## Project layout

~~~
openpip-2.0/
├── CLAUDE.md                  ← this file
├── .claude/                   ← Claude Code config
├── backend/                   ← Django REST Framework
├── frontend/                  ← React + TypeScript (Vite)
├── migration/                 ← legacy refs + migration scripts
├── docs/                      ← deeper documentation
└── docker-compose.yml
~~~

## Status

- Phase: Community bonding (May 2026)
- Approach: Parity-first migration, then enhancements
- Last updated: 2026-05-10
