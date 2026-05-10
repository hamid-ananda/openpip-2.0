# API Endpoint Catalog

## Phase 1 — Parity endpoints

These mirror the behavior of legacy controllers, not new functionality.

| Endpoint | Method | Mirrors legacy |
|---|---|---|
| `/api/proteins/` | GET | List/search by gene/UniProt/Ensembl/Entrez |
| `/api/proteins/{id}/` | GET | Protein detail + interactions |
| `/api/interactions/` | GET | Query interactions with filters |
| `/api/datasets/` | GET | List datasets |
| `/api/upload/` | POST | PSI-MI TAB upload (synchronous, like legacy) |
| `/api/search/` | GET | Unified search |
| `/api/network/{id}/` | GET | Cytoscape.js network data |
| `/api/admin/settings/` | GET/PUT | Portal customization (legacy fields) |
| `/api/export/` | GET | TSV / PSI-MI TAB / PNG / JPG export |

## Phase 2 — New endpoints

Added only after Phase 1 parity is complete.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/upload/validate/` | POST | Real-time validation before import |
| `/api/upload/status/{job_id}/` | GET | Async upload progress |
| `/api/enrichment/` | POST | GO term enrichment analysis |
| `/api/upload/csv/` | POST | Lab-friendly CSV upload variant |

## Conventions

- All endpoints under `/api/` prefix.
- Trailing slash always present (Django default).
- JSON request/response.
- Pagination: cursor-based via DRF defaults, page size 50.
- Auth: JWT in `Authorization: Bearer <token>` header for protected endpoints.
- Errors: standard DRF error format with `detail` field.
