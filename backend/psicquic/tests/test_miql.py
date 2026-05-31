# backend/psicquic/tests/test_miql.py
import pytest
from psicquic.miql import parse_miql
from interactions.models import Interaction
from proteins.models import Protein, Organism, ProteinOrganism


@pytest.fixture
def two_proteins(db):
    org = Organism.objects.create(name="Homo sapiens", taxonomy_id="9606")
    p1 = Protein.objects.create(gene_name="BRCA1", uniprot_id="P38398")
    p2 = Protein.objects.create(gene_name="TP53", uniprot_id="P04637")
    p3 = Protein.objects.create(gene_name="BRCA2", uniprot_id="P51587")
    ProteinOrganism.objects.create(protein=p1, organism=org)
    ProteinOrganism.objects.create(protein=p2, organism=org)
    ProteinOrganism.objects.create(protein=p3, organism=org)
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, score="0.9")
    Interaction.objects.create(interactor_A=p1, interactor_B=p3, score="0.8")
    Interaction.objects.create(interactor_A=p2, interactor_B=p3, score="0.7")
    return p1, p2, p3


def test_plain_text_query(two_proteins):
    qs = parse_miql("BRCA1")
    assert qs.count() == 2  # BRCA1-TP53 and BRCA1-BRCA2


def test_plain_uniprot_query(two_proteins):
    qs = parse_miql("P38398")
    assert qs.count() == 2


def test_ida_prefix(two_proteins):
    qs = parse_miql("idA:P38398")
    assert qs.count() == 2


def test_idb_prefix(two_proteins):
    qs = parse_miql("idB:P04637")
    assert qs.count() == 1


def test_id_prefix_matches_either(two_proteins):
    qs = parse_miql("id:P51587")
    assert qs.count() == 2  # BRCA1-BRCA2 and TP53-BRCA2


def test_taxida_filter(two_proteins):
    qs = parse_miql("taxidA:9606")
    assert qs.count() == 3


def test_unknown_taxon_returns_empty(two_proteins):
    qs = parse_miql("taxidA:0000")
    assert qs.count() == 0


def test_empty_query_returns_all(two_proteins):
    qs = parse_miql("*")
    assert qs.count() == 3
