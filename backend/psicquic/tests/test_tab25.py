# backend/psicquic/tests/test_tab25.py
import pytest
from psicquic.tab25 import format_interaction_tab25, TAB25_HEADER
from interactions.models import Interaction, InteractionDataset
from proteins.models import Protein, Organism, ProteinOrganism
from datasets.models import Dataset


@pytest.fixture
def interaction_with_data(db):
    org = Organism.objects.create(name="Homo sapiens", taxonomy_id="9606")
    p_a = Protein.objects.create(
        gene_name="BRCA1", uniprot_id="P38398", entrez_id="672"
    )
    p_b = Protein.objects.create(
        gene_name="BRCA2", uniprot_id="P51587", entrez_id="675"
    )
    ProteinOrganism.objects.create(protein=p_a, organism=org)
    ProteinOrganism.objects.create(protein=p_b, organism=org)
    dataset = Dataset.objects.create(
        name="Test Dataset",
        pubmed_id="12345678",
        author="Foo et al.",
        year="2020",
    )
    interaction = Interaction.objects.create(
        interactor_A=p_a, interactor_B=p_b, score="0.98"
    )
    InteractionDataset.objects.create(interaction=interaction, dataset=dataset)
    return interaction


def test_tab25_header():
    assert TAB25_HEADER.startswith("#ID(s) interactor A")
    assert TAB25_HEADER.count("\t") == 14  # 15 columns


def test_tab25_format_basic(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    columns = line.split("\t")
    assert len(columns) == 15


def test_tab25_uniprot_ids(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    cols = line.split("\t")
    assert cols[0] == "uniprotkb:P38398"
    assert cols[1] == "uniprotkb:P51587"


def test_tab25_gene_aliases(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    cols = line.split("\t")
    assert "BRCA1" in cols[4]
    assert "BRCA2" in cols[5]


def test_tab25_taxon(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    cols = line.split("\t")
    assert "taxid:9606" in cols[9]
    assert "taxid:9606" in cols[10]


def test_tab25_confidence(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    cols = line.split("\t")
    assert "0.98" in cols[14]


def test_tab25_publication(interaction_with_data):
    line = format_interaction_tab25(interaction_with_data)
    cols = line.split("\t")
    assert "pubmed:12345678" in cols[8]
    assert "Foo et al." in cols[7]
