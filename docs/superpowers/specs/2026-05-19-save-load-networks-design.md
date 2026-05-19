# Save / Load Interaction Networks — Phase 1 Design

**Date:** 2026-05-19  
**Scope:** Phase 1 parity feature — matches legacy `save_interaction_networkAction`

---

## Overview

Authenticated users can save the current visible network (post-filter) and reload it later from their profile. The exact set of visible interactions is stored, giving true round-trip fidelity regardless of DB changes.

---

## Backend

### Models (existing — no schema changes needed)

- `InteractionNetwork` — stores name + query params (query, score_parameter, category_array, tissue_expression_array, interactor_query_string)
- `InteractionInteractionNetworks` — join table: network ↔ interaction IDs (the saved visible set)
- `UserInteractionNetwork` — join table: user ↔ network (ownership)

### Endpoints

All under `interactions/urls.py`, all require `IsAuthenticated`.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/networks` | Save current network |
| `GET` | `/networks` | List user's saved networks |
| `GET` | `/networks/{id}` | Load a saved network |
| `DELETE` | `/networks/{id}` | Delete a saved network |

#### POST /networks

Request body:
```json
{
  "name": "TP53 filtered",
  "query": "TP53",
  "score_parameter": "0.50",
  "category_array": "Published,Validated",
  "tissue_expression_array": "",
  "interaction_ids": [101, 204, 307]
}
```

Creates one `InteractionNetwork`, bulk-creates `InteractionInteractionNetworks` rows, creates one `UserInteractionNetwork`. Returns `{ id, name, interaction_count }`.

#### GET /networks

Returns list of current user's networks:
```json
[
  { "id": 1, "name": "TP53 filtered", "query": "TP53",
    "interaction_count": 45, "saved_at": "2026-05-19T12:00:00Z" }
]
```

`saved_at` is derived from `InteractionNetwork.pk` ordering (no created_at column in legacy schema — use auto PK ordering).

#### GET /networks/{id}

Ownership check: 403 if the requesting user does not own this network.

Response mirrors `SearchResult` shape so the frontend can call `setSearchData()` directly:
```json
{
  "id": 1,
  "name": "TP53 filtered",
  "query": "TP53",
  "score_parameter": "0.50",
  "category_array": "Published,Validated",
  "all_proteins": [...],
  "all_interactions": [...],
  "query_protein_id_array": [...]
}
```

Proteins and interactions are reconstructed from the stored `InteractionInteractionNetworks` rows. `query_protein_id_array` is computed by matching `network.query` against protein gene names in the result set.

#### DELETE /networks/{id}

Ownership check: 403 if not owner. Deletes `UserInteractionNetwork`, `InteractionInteractionNetworks` rows, and `InteractionNetwork`. Returns 204.

### Serializers

- `SavedNetworkListSerializer` — for GET /networks list items
- `SavedNetworkDetailSerializer` — for GET /networks/{id} (full protein/interaction objects)
- `SaveNetworkInputSerializer` — validates POST /networks body

### Tests

`backend/interactions/tests/test_networks.py`:
- Save a network, verify DB rows created
- List returns only the requesting user's networks
- Load reconstructs correct proteins and interactions
- Load returns 403 for non-owner
- Delete removes all related rows; returns 204
- Delete returns 403 for non-owner; 404 for missing network

---

## Frontend

### API hooks — `src/api/networks.ts`

- `useSavedNetworks()` — `useQuery`, key `['networks']`, requires auth
- `useSaveNetwork()` — `useMutation`, POST, invalidates `['networks']` on success
- `useDeleteNetwork()` — `useMutation`, DELETE, invalidates `['networks']` on success

### Save button — in `SearchSidebar.tsx`

Added at the bottom of the Tools section (after the Download accordion), only rendered when `isLoggedIn && term`. Full-width button. On click, shows an inline form below the button: a text input pre-filled with `term`, and Save / Cancel buttons. On submit, calls `useSaveNetwork` with the current store state. Shows inline "Saved!" confirmation for 2s then resets. Error shows inline in red.

Data passed on save:
- `name` — from input
- `query` — `searchTerm` from store
- `score_parameter` — `scoreFilter.toFixed(2)` from store
- `category_array` — active category names joined with comma
- `tissue_expression_array` — empty string (Phase 1)
- `interaction_ids` — IDs of the currently visible (post-filter, post-removal) interactions

### Profile page — `src/features/auth/ProfilePage.tsx`

New "Saved Networks" card inserted between Account card and Admin Settings card. Renders only when logged in (always true on profile page).

Each row shows: name, query chip (monospace), interaction count, delete button. A "Load" button navigates to `/search/{network.query}`.

No "restore exact filters" on load for Phase 1 — the user lands on the fresh search for that query. The saved network's exact interaction set can be viewed via a future `/network/{id}` route (Phase 2).

Empty state: "No saved networks yet."

### MSW handler — `src/mocks/handlers/networks.ts`

Stateful in-memory store. Handles POST (push to store), GET list (return store), DELETE (splice from store). Registered in `src/mocks/handlers/index.ts`.

### Tests

- `src/api/networks.test.ts` — save, list, delete hooks against MSW

---

## Out of scope (Phase 1)

- `/network/{id}` route to view a saved network in the graph (loads exact saved interactions) — deferred to Phase 2
- Restoring exact filter state on load
- Network sharing between users
