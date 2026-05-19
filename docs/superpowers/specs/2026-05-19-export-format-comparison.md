# Export Format Comparison: Legacy vs. openPIP 2.0

**Date:** 2026-05-19  
**Status:** For review by Dr. Helmy before deciding whether to match legacy exactly or keep 2.0 improvements  
**Files compared:**
- Legacy: `~/openPIP/src/AppBundle/Controller/DataDownloadController.php`
- 2.0: `frontend/src/lib/download.ts`

---

## Architecture difference

| Aspect | Legacy | 2.0 |
|---|---|---|
| Where generated | Server-side PHP (fresh DB query per download) | Client-side TypeScript (from search result already in memory) |
| Triggered by | HTTP route per format | JS `Blob` + `<a>` click |
| Filters applied | Server re-queries with filter params | Client formats already-filtered search result |

The 2.0 approach is simpler and faster (no extra round-trip). The formats produced by each side are compared below.

---

## Format-by-format comparison

### 1. Interaction CSV

**Legacy** (`/download/interaction_csv/{search_term}`)

```
ID(s) interactor A,ID(s) interactor B,Alias(es) interactor A,Alias(es) interactor B\r\n
{protein_name},{protein_name},{gene_name},{gene_name}\r\n
```

Example row for BRCA1 ↔ BARD1:
```
Breast cancer type 1 susceptibility protein,BRCA1-associated RING domain protein 1,BRCA1,BARD1\r\n
```

`protein_name` is the full human-readable protein description — not a database identifier. The column label `ID(s) interactor A` is therefore misleading; it contains a name, not an ID.

**2.0** (`formatInteractionsCSV`)

```
UniProt A,UniProt B,Gene A,Gene B,Ensembl A,Ensembl B,Score,Category,Dataset
P38398,Q99728,BRCA1,BARD1,ENSG00000012048,ENSG00000069956,0.95,Published,HuRI
```

**Differences**

| Aspect | Legacy | 2.0 |
|---|---|---|
| Identifier columns | `protein_name` (human description) | UniProt accession (stable database ID) |
| Gene name columns | `gene_name` | `gene_name` — same |
| Score | Not present | ✅ Present |
| Category | Not present | ✅ Present |
| Dataset | Not present | ✅ Present |
| Ensembl ID | Not present | ✅ Present |
| Line endings | `\r\n` | `\n` |
| Header text | `ID(s) interactor A,...` | `UniProt A,...` |

**Recommendation:** Keep 2.0 format. Using `protein_name` as an "ID" is incorrect — it is not a stable identifier and is useless for programmatic lookup. UniProt accession is the right identifier. The additional columns (Score, Category, Dataset) add value without harm.

---

### 2. Interactor CSV

**Legacy** (`/download/interactor_csv/{search_term}`)

For `filter=None` (all interactors):
```
BRCA1, TP53, BARD1, ATM, CHEK2, 
```
A single comma-space-separated string, no newline at end, no header. Not a valid CSV.

For `filter=query_query`:
```
BRCA1
BRCA2
```
Newline-separated gene names, no header.

**2.0** (`formatInteractorsCSV`)

```
Gene Name,UniProt ID,Ensembl ID,Entrez ID,Number of Interactions
BRCA1,P38398,ENSG00000012048,672,156
BARD1,Q99728,ENSG00000069956,580,44
```

One protein per row with all identifiers.

**Differences**

| Aspect | Legacy | 2.0 |
|---|---|---|
| Format | Comma list (not a CSV) | Proper CSV table |
| Header | None | ✅ Present |
| UniProt ID | Not present | ✅ Present |
| Ensembl ID | Not present | ✅ Present |
| Entrez ID | Not present | ✅ Present |
| Interaction count | Not present | ✅ Present |
| Machine-readable | No | ✅ Yes |

**Recommendation:** Keep 2.0 format. The legacy "interactor CSV" is not a valid CSV — it is a comma-separated gene list with no structure. Any downstream tool (R, Python, Excel) expecting a CSV would fail to parse it. The 2.0 format is a proper CSV with all identifiers researchers need.

---

### 3. FASTA

**Legacy** (`/download/multi_fasta/{search_term}`)

For `filter=None` (returns all proteins including interactors):
```
>BRCA1\r\n
MDLSALRVEEVQNVINAMQKILECPICLELIKEPVSTKCDHIFCKFCMLKLLNQKKGPSQCPLCKNDITKRSLQESTRFS...\r\n
```

Proper FASTA format with `>` prefix. Covers ALL interactors found by the search.

For `filter=query_query`:
```
BRCA1\n
MDLSALR...\n
```
**No `>` prefix** — this is malformed FASTA. Also uses `\n` instead of `\r\n`. This appears to be a bug in the legacy code (`getQueryQueryFastaSequences` was written differently from `getInteractorInteractorFastaSequences`).

**2.0** (`formatFASTA`)

```
>BRCA1|P38398
MDLSALRVEEVQNVINAMQKILEC...

```

Always proper FASTA format regardless of filter mode. Adds UniProt accession to the sequence header.

**Differences**

| Aspect | Legacy (filter=None) | Legacy (filter=query_query) | 2.0 |
|---|---|---|---|
| `>` prefix | ✅ Present | ❌ Missing (bug) | ✅ Present |
| UniProt in header | ❌ Not present | ❌ Not present | ✅ `gene\|uniprot` |
| Line endings | `\r\n` | `\n` | `\n` |

**Recommendation:** Keep 2.0 format. The 2.0 output is valid FASTA for both filter modes; legacy has a bug in `query_query` mode (missing `>`). Adding the UniProt accession to the FASTA header (`>BRCA1|P38398`) follows the UniProtKB FASTA convention and is unambiguously better.

---

### 4. PSI-MI TAB

**Legacy** (`/download/psi_mitab/{search_term}`)

42-column tab-separated format. Header row is present (written by the action, not the data function). Data rows:

```
col[0]  = protein_name  ("Breast cancer type 1 susceptibility protein")
col[1]  = protein_name  ("BRCA1-associated RING domain protein 1")
col[2]  = "-"
col[3]  = "-"
col[4]  = gene_name     ("BRCA1")
col[5]  = gene_name     ("BARD1")
col[6..41] = "-"
```

Line endings: `\r\n`.

The header row is the standard PSI-MITAB 2.7 column list, but `col[0]` should contain a controlled-vocabulary ID like `uniprotkb:P38398` — the legacy code puts the full protein description there instead.

**2.0** (`formatPSIMI`)

```
col[0]  = "uniprotkb:P38398"
col[1]  = "uniprotkb:Q99728"
col[4]  = "uniprotkb:BRCA1(gene name)"
col[5]  = "uniprotkb:BARD1(gene name)"
col[14] = score (e.g., "0.95")
col[2,3,6..13,15..41] = "-"
```

Line endings: `\n`.

**Differences**

| Aspect | Legacy | 2.0 |
|---|---|---|
| col[0] — interactor A ID | `protein_name` (full description) | `uniprotkb:{uniprot_id}` ✅ |
| col[4] — interactor A alias | `gene_name` | `uniprotkb:{gene_name}(gene name)` ✅ |
| col[14] — confidence | `-` | score value ✅ |
| Format compliance | Non-compliant (wrong col[0]) | PSI-MITAB 2.7 compliant ✅ |
| Line endings | `\r\n` | `\n` |

**Recommendation:** Keep 2.0 format. The legacy PSI-MITAB is non-compliant: col[0] should be a database accession with namespace prefix (`uniprotkb:P38398`), not a human-readable description. Tools like Cytoscape, STRING, and IntAct expect the PSI-MITAB namespace prefix format. The 2.0 output follows the standard.

---

### 5. SIF (Simple Interaction Format)

**Legacy:** Not present.

**2.0** (`formatSIF`):

```
BRCA1	pp	BARD1
BRCA1	pp	ATM
```

Tab-separated: `geneA\tpp\tgeneB`. One interaction per line.

SIF is a common Cytoscape import format widely used in the network biology community.

**Recommendation:** Keep as a 2.0 addition. It doesn't replace any legacy format — it adds a new export option. It is not a Phase 1 regression.

---

## Summary table

| Format | Action needed | Reason |
|---|---|---|
| Interaction CSV | **Keep 2.0** | Legacy ID column contains protein descriptions, not IDs. 2.0 adds Score/Category/Dataset. |
| Interactor CSV | **Keep 2.0** | Legacy is a comma list, not a CSV. 2.0 is a proper table. |
| FASTA | **Keep 2.0** | Legacy has a bug (missing `>` for query_query). Adding UniProt to header is correct. |
| PSI-MI TAB | **Keep 2.0** | Legacy is non-compliant. 2.0 uses `uniprotkb:` namespace prefix per PSI-MITAB 2.7 spec. |
| SIF | **Keep 2.0** | Net new format, not a regression. |
| Line endings | **Keep `\n`** | `\n` is correct on all modern platforms. `\r\n` is Windows-legacy. |

---

## What to verify with Dr. Helmy

1. **Interaction CSV columns**: The change from protein_name to UniProt accession is strictly better, but if any existing users have scripts parsing the legacy 4-column format, they will break. Are there known downstream consumers of these CSV files?

2. **PSI-MI TAB compliance**: The 2.0 format follows PSI-MITAB 2.7. Should we populate more columns (taxon, detection method, publication) in Phase 2 when we have the data?

3. **SIF format**: Confirm it is acceptable to offer SIF even though it was not in legacy. (It is an addition, not a substitution.)

4. **Score in downloads**: The 2.0 interaction CSV and PSI-MI TAB include the confidence score. Legacy omitted it. Any concerns about exposing raw scores to users?
