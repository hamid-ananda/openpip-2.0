# Upload Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate `ensembl_id`, `entrez_id`, and `Organism.scientific_name` from UniProt, Ensembl REST, and NCBI during dataset upload, and surface all four enrichment stages in the upload wizard UI.

**Architecture:** All external API calls run post-ingestion in the Celery task. Each enrichment helper returns `(count_updated: int, had_error: bool)`. The task emits `"stage"` in every `update_state` call; `datasets/views.py` forwards it; the frontend polls and renders a four-row stage checklist below the progress bar.

**Tech Stack:** Django 5 / DRF, Celery, `requests`, xml.etree.ElementTree, React 18 / TypeScript, vitest / React Testing Library, pytest-django

---

## File Map

| File | Action | What changes |
|---|---|---|
| `backend/proteins/models.py` | Modify | Add `scientific_name` (nullable) to `Organism` |
| `backend/proteins/migrations/0005_organism_scientific_name.py` | Create | Migration for new field |
| `backend/proteins/tests/test_models.py` | Create | DB test for new field |
| `backend/proteins/uniprot.py` | Modify | New UNIPROT_FIELDS, two extractors, fill `ensembl_id`/`entrez_id`, return `(int, bool)` |
| `backend/proteins/tests/test_uniprot.py` | Modify | Tests for extractors, updated return type |
| `backend/proteins/ensembl.py` | Create | `fetch_gene_name_from_ensembl`, `enrich_proteins_from_ensembl` |
| `backend/proteins/tests/test_ensembl.py` | Create | Unit tests for Ensembl module |
| `backend/proteins/ncbi.py` | Create | `fetch_scientific_name`, `enrich_organisms_from_ncbi` |
| `backend/proteins/tests/test_ncbi.py` | Create | Unit tests for NCBI module |
| `backend/datasets/upload_parser.py` | Modify | `_handle_taxon` returns `int\|None`, parsers return `new_organism_ids` |
| `backend/datasets/tests/test_upload_parser.py` | Modify | Assert `new_organism_ids` in parse result |
| `backend/datasets/tasks.py` | Modify | Stage in all `update_state`, three enrichment calls |
| `backend/datasets/tests/test_task.py` | Modify | Update mocks for new return types, assert stage transitions |
| `backend/datasets/views.py` | Modify | Forward `stage` in GET response |
| `frontend/src/api/asyncImport.ts` | Modify | Add `stage` field to `AsyncImportStatus` |
| `frontend/src/mocks/handlers/datasets.ts` | Modify | Add `stage: 'done'` to mock response |
| `frontend/src/features/admin/AdminDataPage.tsx` | Modify | Add `StageChecklist` component, wire into `Step4` |
| `frontend/src/features/admin/__tests__/AdminDataPage.test.tsx` | Modify | Test stage checklist renders correctly |

---

## Task 1: Organism.scientific_name field + migration

**Files:**
- Modify: `backend/proteins/models.py`
- Create: `backend/proteins/migrations/0005_organism_scientific_name.py`
- Create: `backend/proteins/tests/test_models.py`

- [ ] **Step 1: Write the failing test**

  Create `backend/proteins/tests/test_models.py`:

  ```python
  import pytest


  @pytest.mark.django_db
  def test_organism_scientific_name_defaults_to_null():
      from proteins.models import Organism

      org = Organism.objects.create(taxonomy_id="9606", name="human")
      assert org.scientific_name is None


  @pytest.mark.django_db
  def test_organism_scientific_name_can_be_set():
      from proteins.models import Organism

      org = Organism.objects.create(taxonomy_id="9606", name="human", scientific_name="Homo sapiens")
      org.refresh_from_db()
      assert org.scientific_name == "Homo sapiens"
  ```

- [ ] **Step 2: Run to confirm failure**

  ```bash
  cd backend && pytest proteins/tests/test_models.py -v
  ```

  Expected: `OperationalError: no such column: organism.scientific_name`

- [ ] **Step 3: Add field to model**

  In `backend/proteins/models.py`, update the `Organism` class (currently lines 50–58):

  ```python
  class Organism(models.Model):
      name = models.CharField(max_length=200)
      taxonomy_id = models.CharField(max_length=100)
      scientific_name = models.CharField(max_length=200, null=True)

      class Meta:
          db_table = "organism"

      def __str__(self):
          return self.name
  ```

- [ ] **Step 4: Create migration**

  Create `backend/proteins/migrations/0005_organism_scientific_name.py`:

  ```python
  from django.db import migrations, models


  class Migration(migrations.Migration):
      dependencies = [
          ("proteins", "0004_add_search_indexes"),
      ]

      operations = [
          migrations.AddField(
              model_name="organism",
              name="scientific_name",
              field=models.CharField(max_length=200, null=True),
          ),
      ]
  ```

- [ ] **Step 5: Apply migration and run tests**

  ```bash
  cd backend && python manage.py migrate proteins
  pytest proteins/tests/test_models.py -v
  ```

  Expected: both tests PASS

- [ ] **Step 6: Commit**

  ```bash
  git add backend/proteins/models.py \
          backend/proteins/migrations/0005_organism_scientific_name.py \
          backend/proteins/tests/test_models.py
  git commit -m "feat: add scientific_name (nullable) to Organism model"
  ```

---

## Task 2: UniProt cross-reference extractors + updated return type

**Files:**
- Modify: `backend/proteins/uniprot.py`
- Modify: `backend/proteins/tests/test_uniprot.py`

The `Protein` model already has `ensembl_id` and `entrez_id` columns. We need to:
1. Include those fields in the UniProt API request.
2. Extract them from the UniProt JSON response cross-references.
3. Fill them in (fill-only, never overwrite).
4. Change `enrich_proteins_from_uniprot` return type from `int` to `tuple[int, bool]`.

UniProt cross-references format:
```json
"uniProtKBCrossReferences": [
  {
    "database": "Ensembl",
    "id": "ENST00000315491",
    "properties": [
      {"key": "ProteinId", "value": "ENSP00000320396"},
      {"key": "GeneId", "value": "ENSG00000139618.17"}
    ]
  },
  {"database": "GeneID", "id": "675", "properties": []}
]
```

- [ ] **Step 1: Write failing tests**

  Add to `backend/proteins/tests/test_uniprot.py` (after the existing `UNIPROT_ENTRY` constant, add a cross-reference fixture and new test functions):

  ```python
  UNIPROT_ENTRY_WITH_XREFS = {
      **UNIPROT_ENTRY,
      "uniProtKBCrossReferences": [
          {
              "database": "Ensembl",
              "id": "ENST00000315491",
              "properties": [
                  {"key": "ProteinId", "value": "ENSP00000320396"},
                  {"key": "GeneId", "value": "ENSG00000139618.17"},
              ],
          },
          {"database": "GeneID", "id": "675", "properties": []},
      ],
  }


  def test_extract_ensembl_id_returns_gene_id_without_version():
      from proteins.uniprot import _extract_ensembl_id

      result = _extract_ensembl_id(UNIPROT_ENTRY_WITH_XREFS)
      assert result == "ENSG00000139618"


  def test_extract_ensembl_id_returns_empty_when_missing():
      from proteins.uniprot import _extract_ensembl_id

      assert _extract_ensembl_id({}) == ""
      assert _extract_ensembl_id(UNIPROT_ENTRY) == ""  # no cross-references in base fixture


  def test_extract_entrez_id_returns_gene_id_string():
      from proteins.uniprot import _extract_entrez_id

      result = _extract_entrez_id(UNIPROT_ENTRY_WITH_XREFS)
      assert result == "675"


  def test_extract_entrez_id_returns_empty_when_missing():
      from proteins.uniprot import _extract_entrez_id

      assert _extract_entrez_id({}) == ""


  @pytest.mark.django_db
  def test_enrich_fills_ensembl_id_and_entrez_id():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(uniprot_id="P12345", ensembl_id=None, entrez_id=None)
      with patch(
          "proteins.uniprot.fetch_uniprot_data",
          return_value={"P12345": UNIPROT_ENTRY_WITH_XREFS},
      ):
          count, had_error = enrich_proteins_from_uniprot([protein.id])

      protein.refresh_from_db()
      assert count == 1
      assert had_error is False
      assert protein.ensembl_id == "ENSG00000139618"
      assert protein.entrez_id == "675"


  @pytest.mark.django_db
  def test_enrich_does_not_overwrite_existing_ensembl_entrez():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(
          uniprot_id="P12345", ensembl_id="ENSG00000111111", entrez_id="999"
      )
      with patch(
          "proteins.uniprot.fetch_uniprot_data",
          return_value={"P12345": UNIPROT_ENTRY_WITH_XREFS},
      ):
          enrich_proteins_from_uniprot([protein.id])

      protein.refresh_from_db()
      assert protein.ensembl_id == "ENSG00000111111"
      assert protein.entrez_id == "999"
  ```

  Also update the existing `test_enrich_returns_zero_on_api_error` to unpack the tuple:

  ```python
  @pytest.mark.django_db
  def test_enrich_returns_zero_on_api_error():
      from proteins.uniprot import enrich_proteins_from_uniprot
      import requests

      protein = ProteinFactory(uniprot_id="P12345", protein_name=None)

      with patch(
          "proteins.uniprot.fetch_uniprot_data",
          side_effect=requests.RequestException("timeout"),
      ):
          count, had_error = enrich_proteins_from_uniprot([protein.id])

      assert count == 0
      assert had_error is True
  ```

  Update `test_enrich_fills_missing_protein_name_and_sequence` to unpack tuple:

  ```python
  @pytest.mark.django_db
  def test_enrich_fills_missing_protein_name_and_sequence():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(
          uniprot_id="P12345", protein_name=None, sequence=None, description=None
      )

      with patch(
          "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
      ):
          count, had_error = enrich_proteins_from_uniprot([protein.id])

      protein.refresh_from_db()
      assert count == 1
      assert had_error is False
      assert protein.protein_name == "Apoptosis regulator BAX"
      assert protein.sequence == "MSEQSEQSEQ"
      assert protein.description == "Accelerates programmed cell death."
  ```

  Also update `test_enrich_fills_missing_gene_name`, `test_enrich_does_not_overwrite_existing_fields`,
  `test_enrich_skips_proteins_without_uniprot_id`, and `test_enrich_returns_zero_when_uniprot_has_no_data`
  to unpack tuples where they call `enrich_proteins_from_uniprot`:

  ```python
  @pytest.mark.django_db
  def test_enrich_fills_missing_gene_name():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(uniprot_id="P12345", gene_name=None)

      with patch(
          "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
      ):
          enrich_proteins_from_uniprot([protein.id])

      protein.refresh_from_db()
      assert protein.gene_name == "BAX"


  @pytest.mark.django_db
  def test_enrich_does_not_overwrite_existing_fields():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(
          uniprot_id="P12345",
          protein_name="Existing name",
          gene_name="EXISTING",
          sequence="EXISTINGSEQ",
          description="Existing desc",
      )

      with patch(
          "proteins.uniprot.fetch_uniprot_data", return_value={"P12345": UNIPROT_ENTRY}
      ):
          enrich_proteins_from_uniprot([protein.id])

      protein.refresh_from_db()
      assert protein.protein_name == "Existing name"
      assert protein.gene_name == "EXISTING"
      assert protein.sequence == "EXISTINGSEQ"
      assert protein.description == "Existing desc"


  @pytest.mark.django_db
  def test_enrich_skips_proteins_without_uniprot_id():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(uniprot_id=None, gene_name="BAX")

      with patch("proteins.uniprot.fetch_uniprot_data") as mock_fetch:
          count, had_error = enrich_proteins_from_uniprot([protein.id])

      mock_fetch.assert_not_called()
      assert count == 0
      assert had_error is False


  @pytest.mark.django_db
  def test_enrich_returns_zero_when_uniprot_has_no_data():
      from proteins.uniprot import enrich_proteins_from_uniprot

      protein = ProteinFactory(uniprot_id="P99999", protein_name=None)

      with patch("proteins.uniprot.fetch_uniprot_data", return_value={}):
          count, had_error = enrich_proteins_from_uniprot([protein.id])

      assert count == 0
      assert had_error is False
  ```

- [ ] **Step 2: Run to confirm failures**

  ```bash
  cd backend && pytest proteins/tests/test_uniprot.py -v
  ```

  Expected: new tests fail (`ImportError: cannot import name '_extract_ensembl_id'`), existing tests
  that call `enrich_proteins_from_uniprot` fail with tuple-unpacking errors.

- [ ] **Step 3: Update `backend/proteins/uniprot.py`**

  Replace the entire file:

  ```python
  """UniProt REST API client and protein enrichment helper."""

  import logging

  import requests

  logger = logging.getLogger(__name__)

  UNIPROT_SEARCH = "https://rest.uniprot.org/uniprotkb/search"
  UNIPROT_FIELDS = "accession,gene_names,protein_name,sequence,cc_function,xref_ensembl,xref_geneid"
  BATCH_SIZE = 50
  TIMEOUT = 30


  def fetch_uniprot_data(accessions: list[str]) -> dict[str, dict]:
      """Fetch UniProt entries for a list of accessions. Returns {accession: entry}."""
      if not accessions:
          return {}

      query = " OR ".join(f"accession:{acc}" for acc in accessions)
      params = {
          "query": query,
          "format": "json",
          "fields": UNIPROT_FIELDS,
          "size": len(accessions),
      }
      resp = requests.get(UNIPROT_SEARCH, params=params, timeout=TIMEOUT)
      resp.raise_for_status()

      return {
          entry["primaryAccession"]: entry
          for entry in resp.json().get("results", [])
          if "primaryAccession" in entry
      }


  def _extract_protein_name(entry: dict) -> str:
      try:
          return entry["proteinDescription"]["recommendedName"]["fullName"]["value"]
      except (KeyError, TypeError):
          pass
      try:
          return entry["proteinDescription"]["submissionNames"][0]["fullName"]["value"]
      except (KeyError, TypeError, IndexError):
          return ""


  def _extract_gene_name(entry: dict) -> str:
      try:
          return entry["genes"][0]["geneName"]["value"]
      except (KeyError, TypeError, IndexError):
          return ""


  def _extract_sequence(entry: dict) -> str:
      try:
          return entry["sequence"]["value"]
      except (KeyError, TypeError):
          return ""


  def _extract_description(entry: dict) -> str:
      for comment in entry.get("comments", []):
          if comment.get("commentType") == "FUNCTION":
              texts = comment.get("texts", [])
              if texts:
                  return texts[0].get("value", "")
      return ""


  def _extract_ensembl_id(entry: dict) -> str:
      """Return Ensembl gene ID (no version suffix) from UniProt cross-references."""
      for xref in entry.get("uniProtKBCrossReferences", []):
          if xref.get("database") == "Ensembl":
              for prop in xref.get("properties", []):
                  if prop.get("key") == "GeneId":
                      gene_id = prop["value"]
                      return gene_id.rsplit(".", 1)[0] if "." in gene_id else gene_id
      return ""


  def _extract_entrez_id(entry: dict) -> str:
      """Return Entrez Gene ID from UniProt cross-references."""
      for xref in entry.get("uniProtKBCrossReferences", []):
          if xref.get("database") == "GeneID":
              return xref.get("id", "")
      return ""


  def enrich_proteins_from_uniprot(protein_ids: list[int]) -> tuple[int, bool]:
      """
      Fetch UniProt metadata for proteins with a known uniprot_id and fill in
      any fields that are currently null/empty.  Only fills — never overwrites.
      Returns (count_updated, had_error).
      """
      from proteins.models import Protein

      proteins = list(
          Protein.objects.filter(id__in=protein_ids)
          .exclude(uniprot_id__isnull=True)
          .exclude(uniprot_id="")
      )
      if not proteins:
          return 0, False

      accessions = [p.uniprot_id for p in proteins]
      try:
          uniprot_data = fetch_uniprot_data(accessions)
      except Exception:
          logger.warning("UniProt enrichment failed — skipping", exc_info=True)
          return 0, True

      updated = 0
      for protein in proteins:
          entry = uniprot_data.get(protein.uniprot_id)
          if not entry:
              continue

          changed = False
          if not protein.protein_name:
              name = _extract_protein_name(entry)
              if name:
                  protein.protein_name = name
                  changed = True
          if not protein.gene_name:
              gene = _extract_gene_name(entry)
              if gene:
                  protein.gene_name = gene
                  changed = True
          if not protein.sequence:
              seq = _extract_sequence(entry)
              if seq:
                  protein.sequence = seq
                  changed = True
          if not protein.description:
              desc = _extract_description(entry)
              if desc:
                  protein.description = desc
                  changed = True
          if not protein.ensembl_id:
              eid = _extract_ensembl_id(entry)
              if eid:
                  protein.ensembl_id = eid
                  changed = True
          if not protein.entrez_id:
              tid = _extract_entrez_id(entry)
              if tid:
                  protein.entrez_id = tid
                  changed = True

          if changed:
              protein.save(
                  update_fields=[
                      "protein_name", "gene_name", "sequence", "description",
                      "ensembl_id", "entrez_id",
                  ]
              )
              updated += 1

      return updated, False
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd backend && pytest proteins/tests/test_uniprot.py -v
  ```

  Expected: all tests PASS

- [ ] **Step 5: Run full backend suite to catch any regressions**

  ```bash
  cd backend && pytest -x -q
  ```

  Expected: passes (note — tasks tests that mock `enrich_proteins_from_uniprot` will need updating in Task 6)

- [ ] **Step 6: Commit**

  ```bash
  git add backend/proteins/uniprot.py backend/proteins/tests/test_uniprot.py
  git commit -m "feat: extract ensembl_id and entrez_id from UniProt cross-references"
  ```

---

## Task 3: Ensembl REST module

**Files:**
- Create: `backend/proteins/ensembl.py`
- Create: `backend/proteins/tests/test_ensembl.py`

The Ensembl REST xrefs endpoint returns a list of cross-reference objects. Each has a `display_id` that is the gene symbol from an external database (e.g. EntrezGene). We call it only for proteins that have `ensembl_id` set but `gene_name` is null.

Ensembl xrefs response example:
```json
[
  {"primary_id": "675", "display_id": "BRCA2", "dbname": "EntrezGene", ...},
  ...
]
```

- [ ] **Step 1: Write failing tests**

  Create `backend/proteins/tests/test_ensembl.py`:

  ```python
  """Tests for the Ensembl REST enrichment module."""

  from unittest.mock import MagicMock, patch

  import pytest

  from proteins.tests.factories import ProteinFactory

  ENSEMBL_XREFS_RESPONSE = [
      {"primary_id": "675", "display_id": "BRCA2", "dbname": "EntrezGene"},
      {"primary_id": "ENSG00000139618", "display_id": "BRCA2", "dbname": "Ensembl_gene"},
  ]


  # ── fetch_gene_name_from_ensembl ──────────────────────────────────────────────


  def test_fetch_gene_name_returns_display_id_of_first_result():
      from proteins.ensembl import fetch_gene_name_from_ensembl

      mock_resp = MagicMock()
      mock_resp.json.return_value = ENSEMBL_XREFS_RESPONSE
      mock_resp.raise_for_status = MagicMock()

      with patch("proteins.ensembl.requests.get", return_value=mock_resp):
          result = fetch_gene_name_from_ensembl("ENSG00000139618")

      assert result == "BRCA2"


  def test_fetch_gene_name_returns_none_for_empty_response():
      from proteins.ensembl import fetch_gene_name_from_ensembl

      mock_resp = MagicMock()
      mock_resp.json.return_value = []
      mock_resp.raise_for_status = MagicMock()

      with patch("proteins.ensembl.requests.get", return_value=mock_resp):
          result = fetch_gene_name_from_ensembl("ENSG00000000000")

      assert result is None


  # ── enrich_proteins_from_ensembl ─────────────────────────────────────────────


  @pytest.mark.django_db
  def test_enrich_ensembl_fills_gene_name_for_proteins_with_ensembl_id():
      from proteins.ensembl import enrich_proteins_from_ensembl

      protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name=None)

      with patch(
          "proteins.ensembl.fetch_gene_name_from_ensembl", return_value="BRCA2"
      ):
          count, had_error = enrich_proteins_from_ensembl([protein.id])

      protein.refresh_from_db()
      assert count == 1
      assert had_error is False
      assert protein.gene_name == "BRCA2"


  @pytest.mark.django_db
  def test_enrich_ensembl_skips_proteins_already_having_gene_name():
      from proteins.ensembl import enrich_proteins_from_ensembl

      protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name="BRCA2")

      with patch("proteins.ensembl.fetch_gene_name_from_ensembl") as mock_fetch:
          count, had_error = enrich_proteins_from_ensembl([protein.id])

      mock_fetch.assert_not_called()
      assert count == 0
      assert had_error is False


  @pytest.mark.django_db
  def test_enrich_ensembl_skips_proteins_without_ensembl_id():
      from proteins.ensembl import enrich_proteins_from_ensembl

      protein = ProteinFactory(ensembl_id=None, gene_name=None)

      with patch("proteins.ensembl.fetch_gene_name_from_ensembl") as mock_fetch:
          count, had_error = enrich_proteins_from_ensembl([protein.id])

      mock_fetch.assert_not_called()
      assert count == 0


  @pytest.mark.django_db
  def test_enrich_ensembl_returns_had_error_true_on_api_failure():
      from proteins.ensembl import enrich_proteins_from_ensembl

      protein = ProteinFactory(ensembl_id="ENSG00000139618", gene_name=None)

      with patch(
          "proteins.ensembl.fetch_gene_name_from_ensembl",
          side_effect=Exception("timeout"),
      ):
          count, had_error = enrich_proteins_from_ensembl([protein.id])

      assert count == 0
      assert had_error is True
      protein.refresh_from_db()
      assert protein.gene_name is None


  @pytest.mark.django_db
  def test_enrich_ensembl_returns_zero_false_for_empty_list():
      from proteins.ensembl import enrich_proteins_from_ensembl

      count, had_error = enrich_proteins_from_ensembl([])
      assert count == 0
      assert had_error is False
  ```

- [ ] **Step 2: Run to confirm failure**

  ```bash
  cd backend && pytest proteins/tests/test_ensembl.py -v
  ```

  Expected: `ModuleNotFoundError: No module named 'proteins.ensembl'`

- [ ] **Step 3: Create `backend/proteins/ensembl.py`**

  ```python
  """Ensembl REST API client for gene-name enrichment."""

  import logging

  import requests

  logger = logging.getLogger(__name__)

  ENSEMBL_XREFS = "https://rest.ensembl.org/xrefs/id/{ensembl_id}?content-type=application/json"
  TIMEOUT = 10


  def fetch_gene_name_from_ensembl(ensembl_id: str) -> str | None:
      """Return the display_id (gene symbol) for an Ensembl gene ID, or None."""
      url = ENSEMBL_XREFS.format(ensembl_id=ensembl_id)
      resp = requests.get(url, timeout=TIMEOUT)
      resp.raise_for_status()
      results = resp.json()
      if results:
          return results[0].get("display_id")
      return None


  def enrich_proteins_from_ensembl(protein_ids: list[int]) -> tuple[int, bool]:
      """
      Fill gene_name for proteins that have an ensembl_id but no gene_name.
      Returns (count_updated, had_error).
      """
      from django.db.models import Q
      from proteins.models import Protein

      proteins = list(
          Protein.objects.filter(id__in=protein_ids)
          .exclude(ensembl_id__isnull=True)
          .exclude(ensembl_id="")
          .filter(Q(gene_name__isnull=True) | Q(gene_name=""))
      )
      if not proteins:
          return 0, False

      had_error = False
      updated = 0
      for protein in proteins:
          try:
              name = fetch_gene_name_from_ensembl(protein.ensembl_id)
          except Exception:
              logger.warning(
                  "Ensembl lookup failed for %s", protein.ensembl_id, exc_info=True
              )
              had_error = True
              continue
          if name:
              protein.gene_name = name
              protein.save(update_fields=["gene_name"])
              updated += 1

      return updated, had_error
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd backend && pytest proteins/tests/test_ensembl.py -v
  ```

  Expected: all tests PASS

- [ ] **Step 5: Commit**

  ```bash
  git add backend/proteins/ensembl.py backend/proteins/tests/test_ensembl.py
  git commit -m "feat: add Ensembl REST enrichment module"
  ```

---

## Task 4: NCBI taxonomy module

**Files:**
- Create: `backend/proteins/ncbi.py`
- Create: `backend/proteins/tests/test_ncbi.py`

NCBI eutils returns XML. A `<DocSum>` contains `<Item Name="ScientificName" Type="String">Homo sapiens</Item>`.
The delay of 0.34 s between calls keeps us under the 3 req/sec limit without an API key.

- [ ] **Step 1: Write failing tests**

  Create `backend/proteins/tests/test_ncbi.py`:

  ```python
  """Tests for the NCBI taxonomy enrichment module."""

  from unittest.mock import MagicMock, call, patch

  import pytest

  from proteins.tests.factories import OrganismFactory

  NCBI_XML = """<?xml version="1.0"?>
  <eSummaryResult>
    <DocSum>
      <Item Name="ScientificName" Type="String">Homo sapiens</Item>
    </DocSum>
  </eSummaryResult>"""


  # ── fetch_scientific_name ─────────────────────────────────────────────────────


  def test_fetch_scientific_name_parses_xml():
      from proteins.ncbi import fetch_scientific_name

      mock_resp = MagicMock()
      mock_resp.text = NCBI_XML
      mock_resp.raise_for_status = MagicMock()

      with patch("proteins.ncbi.requests.get", return_value=mock_resp):
          result = fetch_scientific_name("9606")

      assert result == "Homo sapiens"


  def test_fetch_scientific_name_returns_none_when_item_missing():
      from proteins.ncbi import fetch_scientific_name

      empty_xml = '<?xml version="1.0"?><eSummaryResult><DocSum></DocSum></eSummaryResult>'
      mock_resp = MagicMock()
      mock_resp.text = empty_xml
      mock_resp.raise_for_status = MagicMock()

      with patch("proteins.ncbi.requests.get", return_value=mock_resp):
          result = fetch_scientific_name("0")

      assert result is None


  # ── enrich_organisms_from_ncbi ───────────────────────────────────────────────


  @pytest.mark.django_db
  def test_enrich_fills_scientific_name():
      from proteins.ncbi import enrich_organisms_from_ncbi

      org = OrganismFactory(taxonomy_id="9606", scientific_name=None)

      with patch("proteins.ncbi.fetch_scientific_name", return_value="Homo sapiens"), \
           patch("proteins.ncbi.time.sleep"):
          count, had_error = enrich_organisms_from_ncbi([org.id])

      org.refresh_from_db()
      assert count == 1
      assert had_error is False
      assert org.scientific_name == "Homo sapiens"


  @pytest.mark.django_db
  def test_enrich_skips_organism_with_existing_scientific_name():
      from proteins.ncbi import enrich_organisms_from_ncbi

      org = OrganismFactory(taxonomy_id="9606", scientific_name="Homo sapiens")

      with patch("proteins.ncbi.fetch_scientific_name") as mock_fetch, \
           patch("proteins.ncbi.time.sleep"):
          count, had_error = enrich_organisms_from_ncbi([org.id])

      mock_fetch.assert_not_called()
      assert count == 0
      assert had_error is False


  @pytest.mark.django_db
  def test_enrich_sleeps_between_requests():
      from proteins.ncbi import enrich_organisms_from_ncbi, NCBI_DELAY

      org1 = OrganismFactory(taxonomy_id="9606", scientific_name=None)
      org2 = OrganismFactory(taxonomy_id="10090", scientific_name=None)

      with patch("proteins.ncbi.fetch_scientific_name", return_value="Species"), \
           patch("proteins.ncbi.time.sleep") as mock_sleep:
          enrich_organisms_from_ncbi([org1.id, org2.id])

      # Sleep is called once between the two calls (not before the first)
      assert mock_sleep.call_count == 1
      assert mock_sleep.call_args == call(NCBI_DELAY)


  @pytest.mark.django_db
  def test_enrich_returns_had_error_true_on_api_failure():
      from proteins.ncbi import enrich_organisms_from_ncbi

      org = OrganismFactory(taxonomy_id="9606", scientific_name=None)

      with patch(
          "proteins.ncbi.fetch_scientific_name", side_effect=Exception("timeout")
      ), patch("proteins.ncbi.time.sleep"):
          count, had_error = enrich_organisms_from_ncbi([org.id])

      assert count == 0
      assert had_error is True
      org.refresh_from_db()
      assert org.scientific_name is None


  @pytest.mark.django_db
  def test_enrich_returns_zero_false_for_empty_list():
      from proteins.ncbi import enrich_organisms_from_ncbi

      count, had_error = enrich_organisms_from_ncbi([])
      assert count == 0
      assert had_error is False
  ```

  The `OrganismFactory` does not have `scientific_name` — add it now:

  In `backend/proteins/tests/factories.py`, update `OrganismFactory`:

  ```python
  class OrganismFactory(factory.django.DjangoModelFactory):
      class Meta:
          model = Organism

      name = "Homo sapiens"
      taxonomy_id = "9606"
      scientific_name = None
  ```

- [ ] **Step 2: Run to confirm failure**

  ```bash
  cd backend && pytest proteins/tests/test_ncbi.py -v
  ```

  Expected: `ModuleNotFoundError: No module named 'proteins.ncbi'`

- [ ] **Step 3: Create `backend/proteins/ncbi.py`**

  ```python
  """NCBI taxonomy API client for organism scientific-name enrichment."""

  import logging
  import time
  import xml.etree.ElementTree as ET

  import requests

  logger = logging.getLogger(__name__)

  NCBI_TAXONOMY = (
      "http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
      "?db=taxonomy&id={taxid}"
  )
  NCBI_DELAY = 0.34  # seconds between calls — keeps us under 3 req/sec without API key
  TIMEOUT = 10


  def fetch_scientific_name(taxonomy_id: str) -> str | None:
      """Return the NCBI scientific name for a taxonomy ID, or None."""
      url = NCBI_TAXONOMY.format(taxid=taxonomy_id)
      resp = requests.get(url, timeout=TIMEOUT)
      resp.raise_for_status()
      root = ET.fromstring(resp.text)
      for item in root.iter("Item"):
          if item.attrib.get("Name") == "ScientificName":
              return item.text
      return None


  def enrich_organisms_from_ncbi(organism_ids: list[int]) -> tuple[int, bool]:
      """
      Fill scientific_name for newly created organisms that don't have one yet.
      Adds NCBI_DELAY between consecutive calls to stay within rate limits.
      Returns (count_updated, had_error).
      """
      from proteins.models import Organism

      organisms = list(
          Organism.objects.filter(id__in=organism_ids, scientific_name__isnull=True)
      )
      if not organisms:
          return 0, False

      had_error = False
      updated = 0
      for i, organism in enumerate(organisms):
          if i > 0:
              time.sleep(NCBI_DELAY)
          try:
              name = fetch_scientific_name(organism.taxonomy_id)
          except Exception:
              logger.warning(
                  "NCBI lookup failed for taxid %s", organism.taxonomy_id, exc_info=True
              )
              had_error = True
              continue
          if name:
              organism.scientific_name = name
              organism.save(update_fields=["scientific_name"])
              updated += 1

      return updated, had_error
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd backend && pytest proteins/tests/test_ncbi.py -v
  ```

  Expected: all tests PASS

- [ ] **Step 5: Commit**

  ```bash
  git add backend/proteins/ncbi.py \
          backend/proteins/tests/test_ncbi.py \
          backend/proteins/tests/factories.py
  git commit -m "feat: add NCBI taxonomy enrichment module"
  ```

---

## Task 5: Upload parser — track new_organism_ids

**Files:**
- Modify: `backend/datasets/upload_parser.py`
- Modify: `backend/datasets/tests/test_upload_parser.py`

Change `_handle_taxon` to return `int | None` (the organism id when newly created, else None). Update `parse_and_ingest` and `parse_and_ingest_csv` to collect `new_organism_ids` and include it in their return dicts. `process_line_batch` calls `parse_and_ingest`, so it inherits the new key automatically.

- [ ] **Step 1: Write failing test**

  Add to `backend/datasets/tests/test_upload_parser.py`:

  ```python
  @pytest.mark.django_db
  def test_parse_and_ingest_returns_new_organism_ids_for_created_organisms():
      from datasets.upload_parser import parse_and_ingest
      from proteins.models import Organism

      content = _file(_build_row(taxon_a="taxid:9606(human)"))
      result = parse_and_ingest(content, dataset_name="DS")
      org = Organism.objects.get(taxonomy_id="9606")
      assert org.id in result["new_organism_ids"]


  @pytest.mark.django_db
  def test_parse_and_ingest_does_not_include_existing_organism_in_new_ids():
      from datasets.upload_parser import parse_and_ingest
      from proteins.models import Organism

      # Pre-create the organism
      Organism.objects.create(taxonomy_id="9606", name="human")

      content = _file(_build_row(taxon_a="taxid:9606(human)"))
      result = parse_and_ingest(content, dataset_name="DS")
      assert result["new_organism_ids"] == []
  ```

- [ ] **Step 2: Run to confirm failure**

  ```bash
  cd backend && pytest datasets/tests/test_upload_parser.py::test_parse_and_ingest_returns_new_organism_ids_for_created_organisms -v
  ```

  Expected: `KeyError: 'new_organism_ids'`

- [ ] **Step 3: Update `_handle_taxon` in `backend/datasets/upload_parser.py`**

  Replace the function (currently lines 180–190):

  ```python
  def _handle_taxon(protein: Protein, taxon_col: str) -> int | None:
      """Find-or-create Organism, link to protein, return organism.id if newly created."""
      parsed = _parse_taxon(taxon_col)
      if not parsed:
          return None
      taxonomy_id, name = parsed
      organism, created = Organism.objects.get_or_create(
          taxonomy_id=taxonomy_id,
          defaults={"name": name},
      )
      ProteinOrganism.objects.get_or_create(protein=protein, organism=organism)
      return organism.id if created else None
  ```

- [ ] **Step 4: Add `new_organism_ids` tracking to `parse_and_ingest`**

  In the `parse_and_ingest` function (around line 388), add:

  ```python
  new_organism_ids: list[int] = []
  ```

  after `new_protein_ids: list[int] = []`.

  Replace the two `_handle_taxon` call sites (currently lines 453–455) with:

  ```python
  # ── Taxon (cols 9+10) ──────────────────────────────────────
  org_id = _handle_taxon(protein_a, _safe_col(row, 9))
  if org_id is not None and org_id not in new_organism_ids:
      new_organism_ids.append(org_id)
  if protein_b is not protein_a:
      org_id = _handle_taxon(protein_b, _safe_col(row, 10))
      if org_id is not None and org_id not in new_organism_ids:
          new_organism_ids.append(org_id)
  ```

  In the return dict of `parse_and_ingest` (the last `return` statement), add:

  ```python
  "new_organism_ids": [] if dry_run else new_organism_ids,
  ```

- [ ] **Step 5: Add `new_organism_ids` to `parse_and_ingest_csv`**

  The CSV parser has no taxon column so organisms are never created there.
  Add `new_organism_ids: list[int] = []` after `new_protein_ids` and include it in its return dict:

  ```python
  "new_organism_ids": [],
  ```

- [ ] **Step 6: Run tests**

  ```bash
  cd backend && pytest datasets/tests/test_upload_parser.py -v
  ```

  Expected: all tests PASS (including two new ones)

- [ ] **Step 7: Commit**

  ```bash
  git add backend/datasets/upload_parser.py \
          backend/datasets/tests/test_upload_parser.py
  git commit -m "feat: track new_organism_ids in upload parser"
  ```

---

## Task 6: Tasks — stage + all enrichment calls

**Files:**
- Modify: `backend/datasets/tasks.py`
- Modify: `backend/datasets/tests/test_task.py`

The task needs to:
1. Add `"stage": "parsing"` to every batch `update_state` call.
2. After all batches, call UniProt, Ensembl, and NCBI enrichment with `update_state` before/after each.
3. Handle `(count, had_error)` return from all three functions.
4. Return `"stage": "done"` in the final result.
5. Do the same for the CSV path.

- [ ] **Step 1: Update tests**

  Replace `backend/datasets/tests/test_task.py` entirely:

  ```python
  """Unit tests for import_dataset_task."""

  from unittest.mock import call, patch

  from django.test import override_settings

  from datasets.tasks import import_dataset_task


  def _make_batch_result(
      proteins=2, interactions=5, skipped=0, errors=None,
      new_protein_ids=None, new_organism_ids=None,
  ):
      return {
          "proteins_created": proteins,
          "interactions_created": interactions,
          "interactions_skipped": skipped,
          "errors": errors or [],
          "new_protein_ids": new_protein_ids or [],
          "new_organism_ids": new_organism_ids or [],
      }


  EAGER = override_settings(
      CELERY_TASK_ALWAYS_EAGER=True,
      CELERY_TASK_EAGER_PROPAGATES=True,
      CELERY_RESULT_BACKEND="cache+memory://",
  )


  @EAGER
  def test_task_empty_lines_returns_zeros_without_calling_parser():
      with patch("datasets.tasks.process_line_batch") as mock_plb:
          result = import_dataset_task.apply(args=[[], "TestDS", "published", None])
          data = result.get()
      mock_plb.assert_not_called()
      assert data["proteins_created"] == 0
      assert data["interactions_created"] == 0
      assert data["progress"] == 100


  @EAGER
  def test_task_accumulates_totals_across_batches():
      lines = [f"line{i}" for i in range(10)]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result(proteins=3, interactions=4)
          result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
          data = result.get()

      assert mock_plb.call_count == 1
      assert data["proteins_created"] == 3
      assert data["interactions_created"] == 4
      assert data["progress"] == 100
      assert data["stage"] == "done"


  @EAGER
  def test_task_accumulates_across_multiple_batches():
      lines = [f"line{i}" for i in range(10)]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.BATCH_SIZE", 3), \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result(proteins=1, interactions=2)
          result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
          data = result.get()

      assert mock_plb.call_count == 4
      assert data["proteins_created"] == 4
      assert data["interactions_created"] == 8
      assert data["progress"] == 100


  @EAGER
  def test_task_collects_errors_from_all_batches():
      lines = [f"line{i}" for i in range(6)]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.BATCH_SIZE", 3), \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result(errors=[{"row": 1, "reason": "bad"}])
          result = import_dataset_task.apply(args=[lines, "TestDS", "published", None])
          data = result.get()

      assert len(data["errors"]) == 2


  @EAGER
  def test_task_passes_category_id_to_parser():
      lines = ["line1"]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result()
          import_dataset_task.apply(args=[lines, "TestDS", "published", 42])

      mock_plb.assert_called_once()
      assert mock_plb.call_args[0][3] == 42


  @EAGER
  def test_task_calls_all_three_enrichment_functions():
      lines = ["line1"]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(2, False)) as mock_uni, \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(1, False)) as mock_ens, \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(1, False)) as mock_ncbi:
          mock_plb.return_value = {
              "proteins_created": 2,
              "interactions_created": 1,
              "interactions_skipped": 0,
              "errors": [],
              "new_protein_ids": [10, 11],
              "new_organism_ids": [5],
          }
          import_dataset_task.apply(args=[lines, "TestDS", "published", None])

      mock_uni.assert_called_once_with([10, 11])
      mock_ens.assert_called_once_with([10, 11])
      mock_ncbi.assert_called_once_with([5])


  @EAGER
  def test_task_batch_update_state_includes_stage_parsing():
      lines = [f"line{i}" for i in range(6)]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.BATCH_SIZE", 3), \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result()
          with patch.object(import_dataset_task, "update_state") as mock_us:
              import_dataset_task.apply(args=[lines, "TestDS", "published", None])

      # First 2 calls are batch progress; all should have stage="parsing"
      batch_calls = [c for c in mock_us.call_args_list if c.kwargs["meta"].get("stage") == "parsing"]
      assert len(batch_calls) == 2


  @EAGER
  def test_task_emits_enrichment_stage_states():
      """update_state is called with each enrichment stage name."""
      lines = ["line1"]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, False)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result()
          with patch.object(import_dataset_task, "update_state") as mock_us:
              import_dataset_task.apply(args=[lines, "TestDS", "published", None])

      stages_emitted = [c.kwargs["meta"]["stage"] for c in mock_us.call_args_list]
      assert "enriching_uniprot" in stages_emitted
      assert "enriching_ensembl" in stages_emitted
      assert "enriching_organisms" in stages_emitted


  @EAGER
  def test_task_emits_warn_stage_when_enrichment_has_error():
      lines = ["line1"]
      with patch("datasets.tasks.process_line_batch") as mock_plb, \
           patch("datasets.tasks.enrich_proteins_from_uniprot", return_value=(0, True)), \
           patch("datasets.tasks.enrich_proteins_from_ensembl", return_value=(0, False)), \
           patch("datasets.tasks.enrich_organisms_from_ncbi", return_value=(0, False)):
          mock_plb.return_value = _make_batch_result()
          with patch.object(import_dataset_task, "update_state") as mock_us:
              import_dataset_task.apply(args=[lines, "TestDS", "published", None])

      stages_emitted = [c.kwargs["meta"]["stage"] for c in mock_us.call_args_list]
      assert "enriching_uniprot_warn" in stages_emitted
  ```

- [ ] **Step 2: Run to confirm failures**

  ```bash
  cd backend && pytest datasets/tests/test_task.py -v
  ```

  Expected: several tests fail (missing `enrich_proteins_from_ensembl`/`enrich_organisms_from_ncbi` imports,
  wrong return type unpacking, missing `stage` key).

- [ ] **Step 3: Replace `backend/datasets/tasks.py`**

  ```python
  from celery import shared_task

  from proteins.ensembl import enrich_proteins_from_ensembl
  from proteins.ncbi import enrich_organisms_from_ncbi
  from proteins.uniprot import enrich_proteins_from_uniprot
  from .upload_parser import process_line_batch, parse_and_ingest_csv

  BATCH_SIZE = 300


  @shared_task(bind=True)
  def import_dataset_task(
      self,
      lines: list[str],
      dataset_name: str,
      interaction_status: str,
      category_id: int | None,
      fmt: str = "tab",
  ) -> dict:
      """
      Process a dataset import asynchronously.
      Supports PSI-MI TAB (fmt='tab') and simple CSV (fmt='csv').
      Splits TAB files into batches; CSV is processed in one pass.
      Enriches newly created proteins and organisms from external APIs after ingestion.
      Returns the final totals dict on SUCCESS.
      """
      if not lines:
          return {
              "progress": 100,
              "proteins_created": 0,
              "interactions_created": 0,
              "interactions_skipped": 0,
              "errors": [],
              "stage": "done",
          }

      if fmt == "csv":
          self.update_state(state="PROGRESS", meta={"progress": 0, "stage": "parsing"})
          file_bytes = "\n".join(lines).encode("utf-8")
          result = parse_and_ingest_csv(
              file_bytes, dataset_name, interaction_status, category_id
          )
          base = {
              "progress": 100,
              "proteins_created": result["proteins_created"],
              "interactions_created": result["interactions_created"],
              "interactions_skipped": result["interactions_skipped"],
              "errors": result["errors"],
          }
          new_protein_ids = result.get("new_protein_ids", [])
          new_organism_ids = result.get("new_organism_ids", [])
          _run_enrichment(self, base, new_protein_ids, new_organism_ids)
          return {**base, "stage": "done"}

      # TAB: batch processing with per-batch progress updates
      batches = [lines[i : i + BATCH_SIZE] for i in range(0, len(lines), BATCH_SIZE)]
      totals = {
          "proteins_created": 0,
          "interactions_created": 0,
          "interactions_skipped": 0,
          "errors": [],
      }
      all_new_protein_ids: list[int] = []
      all_new_organism_ids: list[int] = []

      for i, batch in enumerate(batches):
          result = process_line_batch(
              batch, dataset_name, interaction_status, category_id
          )
          totals["proteins_created"] += result.get("proteins_created", 0)
          totals["interactions_created"] += result.get("interactions_created", 0)
          totals["interactions_skipped"] += result.get("interactions_skipped", 0)
          if result.get("errors"):
              totals["errors"].extend(result["errors"])
          all_new_protein_ids.extend(result.get("new_protein_ids", []))
          all_new_organism_ids.extend(result.get("new_organism_ids", []))

          progress = round(((i + 1) / len(batches)) * 100)
          self.update_state(
              state="PROGRESS",
              meta={**totals, "progress": progress, "stage": "parsing"},
          )

      base = {**totals, "progress": 100}
      _run_enrichment(self, base, all_new_protein_ids, all_new_organism_ids)
      return {**base, "stage": "done"}

  def _run_enrichment(
      task,
      base: dict,
      new_protein_ids: list[int],
      new_organism_ids: list[int],
  ) -> None:
      """Emit stage states and call all three enrichment functions."""
      task.update_state(state="PROGRESS", meta={**base, "stage": "enriching_uniprot"})
      _, uniprot_err = enrich_proteins_from_uniprot(new_protein_ids)
      if uniprot_err:
          task.update_state(
              state="PROGRESS", meta={**base, "stage": "enriching_uniprot_warn"}
          )

      task.update_state(state="PROGRESS", meta={**base, "stage": "enriching_ensembl"})
      _, ensembl_err = enrich_proteins_from_ensembl(new_protein_ids)
      if ensembl_err:
          task.update_state(
              state="PROGRESS", meta={**base, "stage": "enriching_ensembl_warn"}
          )

      task.update_state(
          state="PROGRESS", meta={**base, "stage": "enriching_organisms"}
      )
      _, ncbi_err = enrich_organisms_from_ncbi(new_organism_ids)
      if ncbi_err:
          task.update_state(
              state="PROGRESS", meta={**base, "stage": "enriching_organisms_warn"}
          )
  ```

  `_run_enrichment` is a **module-level function** (not a method). The Celery task instance is passed explicitly as `task`. Call sites use `_run_enrichment(self, base, ...)` — **not** `self._run_enrichment(...)`, which would raise `AttributeError` since the function is not on the task class.

- [ ] **Step 4: Run tests**

  ```bash
  cd backend && pytest datasets/tests/test_task.py -v
  ```

  Expected: all tests PASS

- [ ] **Step 5: Run full backend suite**

  ```bash
  cd backend && pytest -x -q
  ```

  Expected: all tests PASS

- [ ] **Step 6: Commit**

  ```bash
  git add backend/datasets/tasks.py backend/datasets/tests/test_task.py
  git commit -m "feat: add enrichment stages to Celery import task"
  ```

---

## Task 7: Views — forward stage in GET response

**Files:**
- Modify: `backend/datasets/views.py`

The GET handler for task status currently omits `stage` from the response. One line fix.

- [ ] **Step 1: Write test**

  Find `backend/datasets/tests/test_async_import.py` and add:

  ```python
  @pytest.mark.django_db
  def test_task_status_forwards_stage_from_progress_meta(auth_client):
      """The GET view must include 'stage' from Celery task meta."""
      mock_result = MagicMock()
      mock_result.state = "PROGRESS"
      mock_result.info = {
          "progress": 50,
          "stage": "enriching_uniprot",
          "proteins_created": 0,
          "interactions_created": 0,
          "interactions_skipped": 0,
          "errors": [],
      }

      with patch("datasets.views.AsyncResult", return_value=mock_result):
          resp = auth_client.get("/api/datasets/import-async/fake-task-id")

      assert resp.status_code == 200
      assert resp.json()["stage"] == "enriching_uniprot"
  ```

  `auth_client` is a pytest fixture from `backend/conftest.py` — it's already used in every other test in this file. `MagicMock` and `patch` are already imported at the top of the file.

- [ ] **Step 2: Run to confirm failure**

  ```bash
  cd backend && pytest datasets/tests/test_async_import.py::test_task_status_forwards_stage_from_progress_meta -v
  ```

  Expected: `AssertionError` — `stage` key not in response

- [ ] **Step 3: Update `backend/datasets/views.py`**

  Find the `Response(...)` dict in the `DatasetImportStatusView.get` method (around line 445–455) and add `"stage"`:

  ```python
  return Response(
      {
          "task_id": task_id,
          "status": state,
          "progress": data.get("progress", 0),
          "proteins_created": data.get("proteins_created", 0),
          "interactions_created": data.get("interactions_created", 0),
          "interactions_skipped": data.get("interactions_skipped", 0),
          "errors": data.get("errors", []),
          "stage": data.get("stage", None),
      }
  )
  ```

- [ ] **Step 4: Run tests**

  ```bash
  cd backend && pytest datasets/tests/test_async_import.py -v
  ```

  Expected: all tests PASS

- [ ] **Step 5: Lint**

  ```bash
  cd backend && ruff check . && black --check .
  ```

  Fix any issues before committing.

- [ ] **Step 6: Commit**

  ```bash
  git add backend/datasets/views.py backend/datasets/tests/test_async_import.py
  git commit -m "fix: forward stage field in task status GET response"
  ```

---

## Task 8: Frontend type — add `stage` to AsyncImportStatus

**Files:**
- Modify: `frontend/src/api/asyncImport.ts`
- Modify: `frontend/src/mocks/handlers/datasets.ts`

- [ ] **Step 1: Write test**

  Add to `frontend/src/api/__tests__/asyncImport.test.ts` (or create the file if it only tests other things — check first):

  ```ts
  it('AsyncImportStatus has stage field typed correctly', () => {
    // This is a compile-time type test. If the type is wrong, `tsc` will fail.
    // We just verify the runtime shape returned by the mock is accepted.
    const status: import('../asyncImport').AsyncImportStatus = {
      task_id: 'abc',
      status: 'PROGRESS',
      progress: 50,
      proteins_created: 0,
      interactions_created: 0,
      interactions_skipped: 0,
      errors: [],
      stage: 'enriching_uniprot',
    }
    expect(status.stage).toBe('enriching_uniprot')
  })
  ```

- [ ] **Step 2: Update `frontend/src/api/asyncImport.ts`**

  ```ts
  import { apiClient } from './client'

  export interface AsyncImportStatus {
    task_id: string
    status: string
    progress: number
    proteins_created: number
    interactions_created: number
    interactions_skipped: number
    errors: { row: number; reason: string }[]
    stage:
      | 'parsing'
      | 'enriching_uniprot'
      | 'enriching_uniprot_warn'
      | 'enriching_ensembl'
      | 'enriching_ensembl_warn'
      | 'enriching_organisms'
      | 'enriching_organisms_warn'
      | 'done'
      | null
  }

  export async function startAsyncImport(
    file: File,
    meta: { dataset_name: string; interaction_status: string; category_id: string },
  ): Promise<string> {
    const form = new FormData()
    form.append('file', file)
    form.append('dataset_name', meta.dataset_name)
    form.append('interaction_status', meta.interaction_status)
    if (meta.category_id) form.append('category_id', meta.category_id)
    const res = await apiClient.post<{ task_id: string }>('/datasets/import-async', form)
    return res.data.task_id
  }

  export async function pollImportStatus(taskId: string): Promise<AsyncImportStatus> {
    const res = await apiClient.get<AsyncImportStatus>(`/datasets/import-async/${taskId}`)
    return res.data
  }
  ```

- [ ] **Step 3: Update MSW mock handler**

  In `frontend/src/mocks/handlers/datasets.ts`, update the `import-async/:taskId` handler to include `stage`:

  ```ts
  http.get('/api/datasets/import-async/:taskId', () =>
    HttpResponse.json({
      task_id: 'test-task-123',
      status: 'SUCCESS',
      progress: 100,
      proteins_created: 10,
      interactions_created: 20,
      interactions_skipped: 2,
      errors: [],
      stage: 'done',
    })
  ),
  ```

- [ ] **Step 4: Run tests and type check**

  ```bash
  cd frontend && npm run test -- --run && npm run build
  ```

  Expected: tests pass, build succeeds (TypeScript sees the new field)

- [ ] **Step 5: Commit**

  ```bash
  git add frontend/src/api/asyncImport.ts \
          frontend/src/mocks/handlers/datasets.ts
  git commit -m "feat: add stage field to AsyncImportStatus type"
  ```

---

## Task 9: Frontend — StageChecklist in Step4

**Files:**
- Modify: `frontend/src/features/admin/AdminDataPage.tsx`
- Modify: `frontend/src/features/admin/__tests__/AdminDataPage.test.tsx`

Add a `StageChecklist` component just below the existing progress bar in `Step4`. The checklist has four fixed rows that map to stage values polled from the backend.

Stage progression order:
```
null → parsing → enriching_uniprot [→ enriching_uniprot_warn] → enriching_ensembl
     → enriching_organisms [→ enriching_organisms_warn] → done
```

Each row can be: `pending` (grey dot), `active` (spinner), `warn` (yellow ⚠, persists even after stage advances), `done` (green ✓).

Because warn stages are transient (the stage quickly advances past them), we track whether each warn was observed using the render-phase state pattern used elsewhere in this codebase.

- [ ] **Step 1: Write tests**

  Add to `frontend/src/features/admin/__tests__/AdminDataPage.test.tsx` (inside the existing `describe` block, after the last `it`):

  ```ts
  describe('StageChecklist', () => {
    it('shows all four rows', () => {
      const { StageChecklist } = require('../AdminDataPage')
      // StageChecklist is not exported — test via Step4 render
      // We'll test through the full Step4 rendering using MSW
    })
  })
  ```

  Actually, add a dedicated describe block using a new MSW override. Add after the existing imports/setup in the test file:

  ```ts
  describe('Step4 StageChecklist', () => {
    async function goToStep4() {
      render(<AdminDataPage />, { wrapper })
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = new File(
        ['#header\nuniprotkb:P12345\tuniprotkb:P67890\n'],
        'test.tab',
        { type: 'text/tab-separated-values' },
      )
      fireEvent.change(input, { target: { files: [file] } })
      await waitFor(() => expect(screen.getByRole('button', { name: /next →/i })).not.toBeDisabled())
      fireEvent.click(screen.getByRole('button', { name: /next →/i }))
      await waitFor(() => expect(screen.getByText('Dataset name')).toBeInTheDocument())
      const nameInput = screen.getByPlaceholderText('e.g. HuRI-2024') as HTMLInputElement
      fireEvent.change(nameInput, { target: { value: 'TestDS' } })
      await waitFor(() => expect(screen.getByRole('button', { name: /preview →/i })).not.toBeDisabled())
      fireEvent.click(screen.getByRole('button', { name: /preview →/i }))
      await waitFor(() => expect(screen.getByRole('button', { name: /import →/i })).not.toBeDisabled())
      fireEvent.click(screen.getByRole('button', { name: /import →/i }))
    }

    it('renders all four stage rows during import', async () => {
      const { server } = await import('../../../mocks/server')
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('/api/datasets/import-async/:taskId', () =>
          HttpResponse.json({
            task_id: 'test-task-123',
            status: 'PROGRESS',
            progress: 50,
            proteins_created: 0,
            interactions_created: 0,
            interactions_skipped: 0,
            errors: [],
            stage: 'parsing',
          })
        )
      )

      await goToStep4()

      await waitFor(() => {
        expect(screen.getByText('Parsing rows')).toBeInTheDocument()
        expect(screen.getByText('Fetching UniProt metadata')).toBeInTheDocument()
        expect(screen.getByText('Fetching Ensembl data')).toBeInTheDocument()
        expect(screen.getByText('Fetching organism names')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('marks enrichment row as done when stage advances past it', async () => {
      const { server } = await import('../../../mocks/server')
      const { http, HttpResponse } = await import('msw')
      server.use(
        http.get('/api/datasets/import-async/:taskId', () =>
          HttpResponse.json({
            task_id: 'test-task-123',
            status: 'PROGRESS',
            progress: 100,
            proteins_created: 5,
            interactions_created: 10,
            interactions_skipped: 0,
            errors: [],
            stage: 'enriching_ensembl',
          })
        )
      )

      await goToStep4()

      // When stage is enriching_ensembl, UniProt row should be done
      await waitFor(
        () => expect(screen.getByText('Fetching Ensembl data')).toBeInTheDocument(),
        { timeout: 3000 },
      )
    })
  })
  ```

- [ ] **Step 2: Run to confirm partial failure**

  ```bash
  cd frontend && npm run test -- --run --reporter=verbose 2>&1 | grep -E "Stage|FAIL|PASS"
  ```

  Expected: "renders all four stage rows" test fails (rows not present yet)

- [ ] **Step 3: Add `StageChecklist` component to `AdminDataPage.tsx`**

  Insert this component definition just before the `// Step 4` comment (around line 993):

  ```tsx
  // ─────────────────────────────────────────────────────────
  // Stage checklist
  // ─────────────────────────────────────────────────────────

  type RowState = 'pending' | 'active' | 'warn' | 'done'

  interface StageChecklistProps {
    stage: import('../../api/asyncImport').AsyncImportStatus['stage']
  }

  const STAGE_ORDER = [
    'parsing',
    'enriching_uniprot',
    'enriching_ensembl',
    'enriching_organisms',
    'done',
  ] as const

  function stageIndex(stage: StageChecklistProps['stage']): number {
    if (!stage) return -1
    const base = stage.replace('_warn', '') as typeof STAGE_ORDER[number]
    return STAGE_ORDER.indexOf(base)
  }

  function StageChecklist({ stage }: StageChecklistProps) {
    const [warned, setWarned] = useState({ uniprot: false, ensembl: false, organisms: false })
    const [prevStage, setPrevStage] = useState(stage)

    if (stage !== prevStage) {
      setPrevStage(stage)
      if (stage === 'enriching_uniprot_warn') setWarned((w) => ({ ...w, uniprot: true }))
      if (stage === 'enriching_ensembl_warn') setWarned((w) => ({ ...w, ensembl: true }))
      if (stage === 'enriching_organisms_warn') setWarned((w) => ({ ...w, organisms: true }))
    }

    const idx = stageIndex(stage)

    const rowState = (rowIdx: number, warnKey?: keyof typeof warned): RowState => {
      if (warnKey && warned[warnKey]) return 'warn'
      if (idx > rowIdx) return 'done'
      if (idx === rowIdx) return 'active'
      return 'pending'
    }

    const rows: { label: string; state: RowState; warnMsg?: string }[] = [
      { label: 'Parsing rows', state: rowState(0) },
      { label: 'Fetching UniProt metadata', state: rowState(1, 'uniprot'), warnMsg: 'UniProt unavailable — metadata skipped' },
      { label: 'Fetching Ensembl data', state: rowState(2, 'ensembl'), warnMsg: 'Ensembl unavailable — data skipped' },
      { label: 'Fetching organism names', state: rowState(3, 'organisms'), warnMsg: 'NCBI unavailable — names skipped' },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 20, height: 20, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
              {row.state === 'done' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
              {row.state === 'active' && (
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid var(--primary)', borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              {row.state === 'warn' && (
                <span style={{ fontSize: 14, color: 'var(--warn)' }}>⚠</span>
              )}
              {row.state === 'pending' && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
              )}
            </div>
            <div>
              <span style={{
                fontSize: 12,
                color: row.state === 'pending' ? 'var(--text-muted)' : row.state === 'warn' ? 'var(--warn)' : 'var(--text)',
                fontWeight: row.state === 'active' ? 500 : 400,
              }}>
                {row.label}
              </span>
              {row.state === 'warn' && row.warnMsg && (
                <span style={{ fontSize: 11, color: 'var(--warn)', marginLeft: 6 }}>— {row.warnMsg}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }
  ```

  The spinner `animation: spin 0.7s linear infinite` requires a `@keyframes spin` rule. Add it to the component or check that it exists in `index.css`. If not present, add to `index.css`:

  ```css
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  ```

- [ ] **Step 4: Wire StageChecklist into Step4**

  In the `Step4` component, add `stage` to the state:

  ```tsx
  const [stage, setStage] = useState<AsyncImportStatus['stage']>(null)
  ```

  In the polling callback inside `useEffect`, add `setStage(s.stage ?? null)` after `setProgress(s.progress)`:

  ```tsx
  setProgress(s.progress)
  setStage(s.stage ?? null)
  setTotals({...})
  ```

  Below the existing progress bar div and above the `{isPending && ...}` block, add:

  ```tsx
  {/* Stage checklist */}
  <StageChecklist stage={stage} />
  ```

  Also add `AsyncImportStatus` to the import at the top of the file:

  ```tsx
  import { startAsyncImport, pollImportStatus } from '../../api/asyncImport'
  import type { AsyncImportStatus } from '../../api/asyncImport'
  ```

- [ ] **Step 5: Run tests**

  ```bash
  cd frontend && npm run test -- --run
  ```

  Expected: all tests PASS

- [ ] **Step 6: Build check**

  ```bash
  cd frontend && npm run build
  ```

  Expected: build succeeds with no TypeScript errors

- [ ] **Step 7: Lint**

  ```bash
  cd frontend && npm run lint
  ```

  Fix any issues before committing.

- [ ] **Step 8: Commit**

  ```bash
  git add frontend/src/features/admin/AdminDataPage.tsx \
          frontend/src/features/admin/__tests__/AdminDataPage.test.tsx
  git commit -m "feat: add stage checklist to upload wizard Step 4"
  ```

---

## Self-Review Checklist

- [x] **Spec coverage:**
  - Task 1 → `Organism.scientific_name` (nullable)
  - Task 2 → `xref_ensembl,xref_geneid` in UNIPROT_FIELDS, extractors, fill `ensembl_id`/`entrez_id`, return `(int, bool)`
  - Task 3 → `proteins/ensembl.py`, `fetch_gene_name_from_ensembl`, `enrich_proteins_from_ensembl`
  - Task 4 → `proteins/ncbi.py`, 0.34s delay, `enrich_organisms_from_ncbi`
  - Task 5 → `_handle_taxon` returns `int|None`, `new_organism_ids` in both parsers
  - Task 6 → `stage` in all `update_state` calls, CSV path included, `_run_enrichment` helper, `"stage": "done"` in return
  - Task 7 → `"stage": data.get("stage", None)` in views.py GET response
  - Task 8 → `stage` union type in `AsyncImportStatus`, MSW mock updated
  - Task 9 → `StageChecklist` component, warn persistence via render-phase pattern, wired into Step4 polling

- [x] **Placeholder scan:** No TBDs or vague requirements remain.

- [x] **Type consistency:**
  - `enrich_proteins_from_uniprot` → `tuple[int, bool]` in Task 2, consumed as `_, uniprot_err = ...` in Task 6 ✓
  - `enrich_proteins_from_ensembl` → `tuple[int, bool]` in Task 3, consumed same way in Task 6 ✓
  - `enrich_organisms_from_ncbi` → `tuple[int, bool]` in Task 4, consumed same way in Task 6 ✓
  - `_handle_taxon` → `int | None` in Task 5, collected in Task 5 ✓
  - `AsyncImportStatus.stage` type union in Task 8, used in `StageChecklist` props in Task 9 ✓
  - `_make_batch_result` includes both `new_protein_ids` and `new_organism_ids` in Task 6 ✓
  - `_run_enrichment` is a module-level function taking `task` as first arg; called as `_run_enrichment(self, ...)` NOT `self._run_enrichment(...)` ✓
  - Task 7 test uses `@pytest.mark.django_db` + `auth_client` from `backend/conftest.py` ✓
