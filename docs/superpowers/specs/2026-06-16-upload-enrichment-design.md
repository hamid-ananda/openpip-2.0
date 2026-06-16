# Upload Enrichment — Design Spec
**Date:** 2026-06-16
**Branch:** phase-3

---

## Problem

When a dataset is uploaded, the legacy openPIP fetches metadata from three external sources to enrich protein and organism records. v2 only does partial UniProt enrichment and misses:

| Gap | Impact |
|---|---|
| Ensembl ID + Entrez gene ID not extracted from UniProt response | `ensembl_id` and `entrez_id` fields always null after upload |
| No Ensembl REST lookup for Ensembl-identified proteins | Proteins identified by `ENSG...` get no gene name or metadata |
| No NCBI taxonomy lookup for organism names | `scientific_name` never populated; only the informal inline name (e.g. `"human"`) is stored |

Additionally, UniProt enrichment currently runs silently after batch ingestion with no progress signal — the UI shows a stuck progress bar at 100% with no indication of what's happening.

---

## Decisions

### 1. Organism model
Add `scientific_name = models.CharField(max_length=200, null=True)` to `Organism`.  
Keep `name` as the inline display fallback (populated from TAB file, e.g. `"human"`).  
Do **not** add `common_name` — redundant given `name` already serves that role.  
Requires a new migration.

### 2. Enrichment scope
Implement all four gaps:
- Extract Ensembl ID and Entrez ID from UniProt JSON cross-references
- Add Ensembl REST API lookup for Ensembl-identified proteins
- Add NCBI taxonomy lookup for organism scientific names

### 3. Enrichment timing
All external API calls run **post-ingestion** — after all batches are parsed and committed. Same pattern as current UniProt enrichment. Organisms are never enriched inline during row parsing.

### 4. NCBI rate limiting
NCBI eutils allows 3 requests/second without an API key. Organism NCBI calls fire **sequentially with a 0.34s delay** between each one. Only newly created organisms (tracked via `get_or_create` `created=True`) are enriched — existing organisms are skipped.

### 5. External API failure behaviour
Enrich but **warn, never fail**. If UniProt, Ensembl REST, or NCBI is unreachable:
- The import still completes successfully
- The affected enrichment stage transitions to a **warning state** in the UI checklist
- A descriptive message is surfaced (e.g. "UniProt unavailable — protein metadata skipped")
- Errors are included in the task result's `errors` list

---

## Backend Architecture

### `proteins/uniprot.py` — changes

Add `xref_ensembl,xref_geneid` to `UNIPROT_FIELDS`.

Add two extractors:
```python
def _extract_ensembl_id(entry: dict) -> str:
    # First uniProtKBCrossReferences entry with database="Ensembl",
    # take properties[key="GeneId"].value, strip version suffix (.N)

def _extract_entrez_id(entry: dict) -> str:
    # First uniProtKBCrossReferences entry with database="GeneID", take id
```

Update `enrich_proteins_from_uniprot` to save `ensembl_id` and `entrez_id` (fill-only, never overwrite).  
Update `update_fields` to include `"ensembl_id"` and `"entrez_id"`.

### `proteins/ensembl.py` — new file

```python
ENSEMBL_XREFS = "https://rest.ensembl.org/xrefs/id/{ensembl_id}?content-type=application/json"

def fetch_gene_name_from_ensembl(ensembl_id: str) -> str | None:
    # GET the xrefs endpoint, return display_id of first result

def enrich_proteins_from_ensembl(protein_ids: list[int]) -> int:
    # For proteins with ensembl_id set but gene_name empty,
    # call fetch_gene_name_from_ensembl and fill gene_name.
    # Returns count of proteins updated.
    # Warns but does not raise on failure.
```

### `proteins/ncbi.py` — new file

```python
NCBI_TAXONOMY = "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id={taxid}"
NCBI_DELAY = 0.34  # seconds between calls — stays under 3 req/sec limit

def fetch_scientific_name(taxonomy_id: str) -> str | None:
    # GET esummary, parse ScientificName from XML

def enrich_organisms_from_ncbi(organism_ids: list[int]) -> tuple[int, bool]:
    # For each organism with scientific_name null,
    # call fetch_scientific_name with NCBI_DELAY between calls.
    # Returns (count_updated, had_error).
    # Warns but does not raise on failure.
```

### `datasets/upload_parser.py` — changes

`_handle_taxon` already uses `get_or_create`. Change the return value of `process_line_batch` to include `new_organism_ids: list[int]` — IDs where `created=True`.

### `datasets/tasks.py` — changes

Track `all_new_organism_ids` across batches (same pattern as `all_new_protein_ids`).

Add `stage` to every `update_state` call. Each enrichment function returns `(count, had_error: bool)`. On error the stage advances to its `_warn` variant before moving on:

```python
# During batch ingestion
self.update_state(state="PROGRESS", meta={
    **totals, "progress": progress, "stage": "parsing"
})

# UniProt enrichment
self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_uniprot"})
_, uniprot_err = enrich_proteins_from_uniprot(all_new_protein_ids)
if uniprot_err:
    self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_uniprot_warn"})

# Ensembl enrichment
self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_ensembl"})
_, ensembl_err = enrich_proteins_from_ensembl(all_new_protein_ids)
if ensembl_err:
    self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_ensembl_warn"})

# NCBI organism enrichment
self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_organisms"})
_, ncbi_err = enrich_organisms_from_ncbi(all_new_organism_ids)
if ncbi_err:
    self.update_state(state="PROGRESS", meta={**totals, "progress": 100, "stage": "enriching_organisms_warn"})
```

All three enrichment functions return `(count_updated, had_error: bool)` — update `enrich_proteins_from_uniprot` signature to match.

Final return includes `"stage": "done"`. The view's `data.get("stage")` will pick this up from the SUCCESS result.

**CSV path:** `parse_and_ingest_csv` also creates organisms. Update it to also return `new_organism_ids` and give the CSV branch in the task the same four enrichment stages with `update_state` calls.

---

## Frontend Architecture

### `datasets/views.py` — changes

The GET task-status response currently does not forward `stage`. Add:
```python
"stage": data.get("stage", None),
```
to the `Response(...)` dict so the frontend receives it.

### `src/api/asyncImport.ts` — changes

Add `stage` to `AsyncImportStatus`:
```ts
stage: 'parsing' | 'enriching_uniprot' | 'enriching_uniprot_warn'
     | 'enriching_ensembl' | 'enriching_ensembl_warn'
     | 'enriching_organisms' | 'enriching_organisms_warn'
     | 'done' | null
```

### `AdminDataPage.tsx` Step 4 — changes

Replace the plain progress bar with a **two-part layout**:

**Top:** existing progress bar (active during `stage === "parsing"`, fills to 100%, then stays full).

**Below:** stage checklist — 4 fixed rows, always rendered:

| Row | Label | Active stage | Done when |
|---|---|---|---|
| 1 | Parsing rows | `parsing` | progress = 100 |
| 2 | Fetching UniProt metadata | `enriching_uniprot` | stage advances past it |
| 3 | Fetching Ensembl data | `enriching_ensembl` | stage advances past it |
| 4 | Fetching organism names | `enriching_organisms` | `stage === "done"` |

Each row has three visual states:
- **Pending** — grey dot, label dimmed
- **Active** — spinning indicator, label normal weight
- **Done** — green checkmark ✓
- **Warning** — yellow ⚠ with short message (e.g. "NCBI unavailable — names skipped")

Stage mapping to row states is a pure function of the current `stage` string — no local state needed beyond what's polled.

---

## Data Flow

```
Upload file
    │
    ▼
Celery task starts
    │
    ├── [stage: "parsing"] Batch ingestion loop (0→100%)
    │       collect new_protein_ids, new_organism_ids
    │
    ├── [stage: "enriching_uniprot"]
    │       enrich_proteins_from_uniprot() — fills gene_name, protein_name,
    │       sequence, description, ensembl_id, entrez_id
    │
    ├── [stage: "enriching_ensembl"]
    │       enrich_proteins_from_ensembl() — fills gene_name for
    │       Ensembl-identified proteins with no gene_name yet
    │
    ├── [stage: "enriching_organisms" or "enriching_organisms_warn"]
    │       enrich_organisms_from_ncbi() — fills scientific_name
    │       0.34s delay between NCBI calls
    │
    └── [stage: "done"] Return final totals
```

---

## Migration

One new migration for `proteins`:
```python
migrations.AddField(
    model_name='organism',
    name='scientific_name',
    field=models.CharField(max_length=200, null=True),
)
```

---

## Error Handling Summary

| Scenario | Behaviour |
|---|---|
| UniProt API down | Stage 2 skipped, `errors` list gets one entry, checklist row shows ⚠ |
| Ensembl REST down | Stage 3 skipped, same pattern |
| NCBI rate-limited / down | Stage 4 shows ⚠ with message, `scientific_name` stays null |
| Row parse error | Already handled — goes into `errors[]`, import continues |
| All APIs down | All three enrichment rows show ⚠, import still completes |

---

## Testing

- `proteins/tests/test_uniprot.py` — add tests for `_extract_ensembl_id`, `_extract_entrez_id`
- `proteins/tests/test_ensembl.py` — new; mock Ensembl REST, test `enrich_proteins_from_ensembl`
- `proteins/tests/test_ncbi.py` — new; mock NCBI eutils, test delay, test failure path
- `datasets/tests/test_task.py` — assert `stage` transitions in task meta; assert `new_organism_ids` returned from parser
- Frontend: update Step4 test to assert checklist rows render and transition correctly
