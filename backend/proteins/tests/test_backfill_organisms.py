import pytest
from django.core.management import call_command

from proteins.models import Organism, Protein, ProteinOrganism
from proteins.uniprot import base_accession, extract_taxon


def _entry(accession, taxon_id=9606, scientific_name="Homo sapiens"):
    return {
        "primaryAccession": accession,
        "organism": {"taxonId": taxon_id, "scientificName": scientific_name},
    }


@pytest.mark.parametrize(
    "stored,expected",
    [
        ("Q07817-1", "Q07817"),
        ("Q07817-12", "Q07817"),
        ("Q07817", "Q07817"),
        ("", ""),
        (None, ""),
    ],
)
def test_base_accession_strips_isoform_suffix(stored, expected):
    assert base_accession(stored) == expected


def test_extract_taxon_reads_organism_block():
    assert extract_taxon(_entry("P38398")) == ("9606", "Homo sapiens")


def test_extract_taxon_returns_none_without_a_taxon():
    assert extract_taxon({"primaryAccession": "P38398"}) is None


@pytest.mark.django_db
def test_backfill_links_proteins_including_isoforms(monkeypatch):
    canonical = Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")
    isoform = Protein.objects.create(gene_name="BRCA2", uniprot_id="P51587-2")

    seen = []

    def fake_fetch(accessions):
        seen.extend(accessions)
        return {acc: _entry(acc) for acc in accessions}

    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        fake_fetch,
    )
    call_command("backfill_protein_organisms", sleep=0)

    # The isoform is queried by its base accession, or UniProt returns nothing.
    assert "P51587" in seen and "P51587-2" not in seen
    assert ProteinOrganism.objects.filter(protein=canonical).exists()
    assert ProteinOrganism.objects.filter(protein=isoform).exists()

    organism = Organism.objects.get(taxonomy_id="9606")
    assert organism.scientific_name == "Homo sapiens"


@pytest.mark.django_db
def test_backfill_reuses_an_existing_organism_and_fills_its_scientific_name(
    monkeypatch,
):
    # Legacy rows carry a common name and no scientific name.
    Organism.objects.create(name="human", taxonomy_id="9606")
    Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")

    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        lambda accessions: {acc: _entry(acc) for acc in accessions},
    )
    call_command("backfill_protein_organisms", sleep=0)

    assert Organism.objects.filter(taxonomy_id="9606").count() == 1
    organism = Organism.objects.get(taxonomy_id="9606")
    assert organism.scientific_name == "Homo sapiens"
    assert organism.name == "human"  # not overwritten


@pytest.mark.django_db
def test_backfill_skips_proteins_that_already_have_an_organism(monkeypatch):
    organism = Organism.objects.create(name="human", taxonomy_id="9606")
    linked = Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")
    ProteinOrganism.objects.create(protein=linked, organism=organism)

    called = []
    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        lambda accessions: called.append(accessions) or {},
    )
    call_command("backfill_protein_organisms", sleep=0)

    assert called == []  # nothing to look up, so no request at all
    assert ProteinOrganism.objects.count() == 1


@pytest.mark.django_db
def test_backfill_dry_run_writes_nothing(monkeypatch):
    Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")
    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        lambda accessions: {acc: _entry(acc) for acc in accessions},
    )
    call_command("backfill_protein_organisms", "--dry-run", sleep=0)

    assert ProteinOrganism.objects.count() == 0
    assert Organism.objects.count() == 0


@pytest.mark.django_db
def test_backfill_reports_unresolved_without_guessing(monkeypatch):
    Protein.objects.create(gene_name="GHOST", uniprot_id="X99999")
    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        lambda accessions: {},
    )
    call_command("backfill_protein_organisms", sleep=0)

    # An unknown accession stays unlinked rather than defaulting to human.
    assert ProteinOrganism.objects.count() == 0


@pytest.mark.django_db
def test_backfill_survives_a_failing_batch(monkeypatch):
    Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")

    def explode(accessions):
        raise RuntimeError("UniProt is down")

    monkeypatch.setattr(
        "proteins.management.commands.backfill_protein_organisms.fetch_uniprot_data",
        explode,
    )
    call_command("backfill_protein_organisms", sleep=0)  # must not raise

    assert ProteinOrganism.objects.count() == 0
