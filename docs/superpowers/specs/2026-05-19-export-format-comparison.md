# Export Format Comparison: Legacy vs. openPIP 2.0

**Date:** 2026-05-19 (corrected 2026-05-21)  
**Status:** For review by Dr. Helmy before deciding whether to match legacy exactly or keep 2.0 improvements  
**Files compared:**
- Legacy: `~/openPIP/src/AppBundle/Controller/DownloadController.php` (`interaction_csvAction`, `interactor_csvAction`)
- 2.0: `frontend/src/lib/download.ts`

> **Correction (2026-05-21):** The original version of this doc compared against `DataDownloadController.php`, which is dead code never reached by production routes. The active production controller is `DownloadController.php`. The format tables below have been updated to reflect the real production output.

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

**Legacy** (`/download/interaction_csv/` — `interaction_csvAction` in `DownloadController.php`)

```
Unique identifier for interactor A,Unique identifier for interactor B,Alternative identifier for interactor A,Alternative identifier for interactor B,Aliases for A,Aliases for B,Query Status Interactor A,Query Status Interactor B,First author,Identifier of the publication,Confidence score,Interaction Status\n
```

Example row for BRCA1 ↔ BARD1 (BRCA1 is the query protein):
```
P38398,Q99728,ENSG00000012048,ENSG00000069956,BRCA1,BARD1,query,non_query,HuRI(2014),22366785,0.95,Published\r\n
```

Columns:
- Col 0–1: UniProt IDs (labeled "Unique identifier")
- Col 2–3: Ensembl IDs (labeled "Alternative identifier")
- Col 4–5: gene names (labeled "Aliases")
- Col 6–7: `query` or `non_query` for each interactor
- Col 8: all dataset authors joined with `;` (format: `Author(Year);Author2(Year2)`)
- Col 9: all dataset publication IDs joined with `;`
- Col 10: confidence score (`-` if absent)
- Col 11: interaction status

**2.0** (`formatInteractionsCSV`) — after 2026-05-21 fix

```
UniProt A,UniProt B,Gene A,Gene B,Ensembl A,Ensembl B,Query Status A,Query Status B,Score,Category,Dataset
P38398,Q99728,BRCA1,BARD1,ENSG00000012048,ENSG00000069956,query,non_query,0.95,Published,HuRI(2014)
```

**Differences**

| Aspect | Legacy | 2.0 |
|---|---|---|
| UniProt accession | ✅ Present (col 0–1) | ✅ Present |
| Ensembl ID | ✅ Present (col 2–3, "Alternative identifier") | ✅ Present |
| Gene name | ✅ Present (col 4–5, "Aliases") | ✅ Present |
| Query Status A/B | ✅ Present (`query` / `non_query`) | ✅ Present (added 2026-05-21) |
| Dataset authors | ✅ All joined with `;` | ✅ All joined with `;` (fixed 2026-05-21) |
| Publication IDs | ✅ Present (col 9) | ❌ Not present |
| Score | ✅ Present | ✅ Present |
| Category | ✅ Present ("Interaction Status") | ✅ Present |
| Column order | UniProt, Ensembl, Gene, QueryStatus, Dataset, Score, Category | UniProt, Gene, Ensembl, QueryStatus, Score, Category, Dataset |
| Line endings | `\r\n` (data rows) | `\n` |
| Header text | Verbose PSI-MITAB-style labels | Short descriptive labels |

**Remaining gap:** The 2.0 format does not include the publication ID (PubMed ID) column. This is a minor omission — downstream tools rarely use this from a CSV. Confirm with Dr. Helmy whether to add it.

**Recommendation:** Keep 2.0 format. Column names are cleaner, column order is more intuitive, and the semantic content is equivalent except for the publication ID column.

---

### 2. Interactor CSV

**Legacy** (`/download/interactor_csv/` — `interactor_csvAction` in `DownloadController.php`)

```
Gene Name,UniProt ID,Ensembl ID,Entrez ID,Description,Query Status,Tissue Expression,Subcellular Location\n
BRCA1,P38398,ENSG00000012048,672,"Breast cancer type 1 susceptibility protein",query\n
```

Columns:
- Gene Name, UniProt ID, Ensembl ID, Entrez ID — identifiers
- Description — protein description (double-quoted to escape commas)
- Query Status — `query` or `non_query`
- Tissue Expression, Subcellular Location — in header only; **not actually populated in the data rows** (legacy bug/omission)

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
| Header | ✅ Present | ✅ Present |
| UniProt ID | ✅ Present | ✅ Present |
| Ensembl ID | ✅ Present | ✅ Present |
| Entrez ID | ✅ Present | ✅ Present |
| Description | ✅ Present | ❌ Not present |
| Query Status | ✅ Present | ❌ Not present |
| Number of interactions | ❌ Not present | ✅ Present |
| Tissue Expression / Subcellular Location | In header, not in rows (bug) | Not present |
| Machine-readable | ✅ Yes (proper CSV) | ✅ Yes |

**Recommendation:** Keep 2.0 format. The Description and Query Status columns are additive (not data loss) and can be added later if Dr. Helmy requests parity. The "Number of Interactions" column in 2.0 replaces them with arguably more useful data. The Tissue Expression / Subcellular Location columns in legacy are phantom headers with no data.

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
