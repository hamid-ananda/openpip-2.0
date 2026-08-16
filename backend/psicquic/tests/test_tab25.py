# backend/psicquic/tests/test_tab25.py
import pytest
from psicquic.tab25 import format_interaction_tab25, TAB25_HEADER
from interactions.models import Interaction, InteractionDataset
from proteins.models import Protein, Organism, ProteinOrganism, Annotation
from interactions.models import AnnotationInteraction
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
    # TAB 2.5 column 8 is `Surname-Year`, not the free-text author string.
    assert cols[7] == "Foo-2020"


def test_tab25_appends_doi_to_publication_identifiers(db):
    """Column 9 takes several pipe-separated identifiers; preprints need the DOI."""
    org = Organism.objects.create(name="Homo sapiens", taxonomy_id="9606")
    p_a = Protein.objects.create(gene_name="A", uniprot_id="P00001")
    p_b = Protein.objects.create(gene_name="B", uniprot_id="P00002")
    ProteinOrganism.objects.create(protein=p_a, organism=org)
    ProteinOrganism.objects.create(protein=p_b, organism=org)
    dataset = Dataset.objects.create(
        name="Preprint Dataset",
        pubmed_id="12345678",
        doi="10.1038/s41586-020-2188-x",
        author="Luck et al.",
        year="2020",
    )
    interaction = Interaction.objects.create(interactor_A=p_a, interactor_B=p_b)
    InteractionDataset.objects.create(interaction=interaction, dataset=dataset)

    cols = format_interaction_tab25(interaction).split("\t")
    assert cols[8] == "pubmed:12345678|doi:10.1038/s41586-020-2188-x"
    assert cols[7] == "Luck-2020"


def test_tab25_publication_falls_back_when_dataset_is_uncited(db):
    p_a = Protein.objects.create(gene_name="A", uniprot_id="P00003")
    p_b = Protein.objects.create(gene_name="B", uniprot_id="P00004")
    dataset = Dataset.objects.create(name="Unpublished")
    interaction = Interaction.objects.create(interactor_A=p_a, interactor_B=p_b)
    InteractionDataset.objects.create(interaction=interaction, dataset=dataset)

    cols = format_interaction_tab25(interaction).split("\t")
    assert cols[7] == "-"
    assert cols[8] == "-"


def _annotate(interaction, type_name, payload):
    """Attach a raw annotation row, as the legacy dump stores them."""
    annotation = Annotation.objects.create(annotation=payload, type_name=type_name)
    AnnotationInteraction.objects.create(interaction=interaction, annotation=annotation)


def test_tab25_detection_method_from_litbm(interaction_with_data):
    _annotate(
        interaction_with_data,
        "litbm_interaction",
        '{"pmid":"8555189","experiment_type":"0018","binary_type":"binary"}',
    )
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == 'psi-mi:"MI:0018"(two hybrid)'
    assert columns[11] == 'psi-mi:"MI:0407"(direct interaction)'


def test_tab25_detection_method_pipes_multiple_experiments(interaction_with_data):
    # 47k litbm rows cover 12k interactions, so several methods per row is normal.
    _annotate(
        interaction_with_data,
        "litbm_interaction",
        '{"experiment_type":"0096","binary_type":"non_binary"}',
    )
    _annotate(
        interaction_with_data,
        "litbm_interaction",
        '{"experiment_type":"0018","binary_type":"binary"}',
    )
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == 'psi-mi:"MI:0018"(two hybrid)|psi-mi:"MI:0096"(pull down)'
    # Both evidence strengths are reported rather than collapsed to the stronger.
    assert 'psi-mi:"MI:0407"(direct interaction)' in columns[11]
    assert 'psi-mi:"MI:0915"(physical association)' in columns[11]


def test_tab25_unlabelled_code_emits_bare_identifier(interaction_with_data):
    # Better an unlabelled CV reference than an invented term name.
    _annotate(interaction_with_data, "litbm_interaction", '{"experiment_type":"9999"}')
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == 'psi-mi:"MI:9999"'


def test_tab25_y2h_screen_infers_two_hybrid(interaction_with_data):
    # An experiment annotation carries DB/AD domains, which only Y2H produces.
    _annotate(
        interaction_with_data,
        "experiment",
        '{"dataset":"HI-III","dna_binding_domain":"TNMD",'
        '"activation_binding_domain":"SPAG4","assay_version":2}',
    )
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == 'psi-mi:"MI:0018"(two hybrid)'
    assert columns[11] == 'psi-mi:"MI:0407"(direct interaction)'


def test_tab25_litbm_wins_over_the_y2h_default(interaction_with_data):
    # Recorded evidence beats the inference when both are present.
    _annotate(interaction_with_data, "experiment", '{"dna_binding_domain":"TNMD"}')
    _annotate(interaction_with_data, "litbm_interaction", '{"experiment_type":"0114"}')
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == 'psi-mi:"MI:0114"(x-ray crystallography)'


def test_tab25_survives_a_malformed_annotation(interaction_with_data):
    # A varchar column holding JSON will eventually hold something that is not.
    _annotate(interaction_with_data, "litbm_interaction", "{not json at all")
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == "-"
    assert len(columns) == 15


def test_tab25_no_annotations_still_reports_unknown(interaction_with_data):
    columns = format_interaction_tab25(interaction_with_data).split("\t")
    assert columns[6] == "-"
    assert columns[11] == "-"
