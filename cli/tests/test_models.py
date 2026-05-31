from openpip.models import Protein, Interaction, Dataset, NetworkData


def test_protein_from_dict():
    data = {
        "id": 1,
        "gene_name": "BRCA1",
        "uniprot_id": "P38398",
        "protein_name": "Breast cancer type 1",
        "ensembl_id": "ENSG00000012048",
        "entrez_id": "672",
        "description": "Tumor suppressor",
        "number_of_interactions_in_database": 142,
    }
    p = Protein.model_validate(data)
    assert p.gene_name == "BRCA1"
    assert p.uniprot_id == "P38398"


def test_protein_optional_fields():
    p = Protein.model_validate({"id": 1, "gene_name": "BRCA1"})
    assert p.uniprot_id is None


def test_interaction_from_dict():
    data = {
        "id": 10,
        "interactor_A": {"id": 1, "gene_name": "BRCA1", "uniprot_id": "P38398"},
        "interactor_B": {"id": 2, "gene_name": "TP53", "uniprot_id": "P04637"},
        "score": "0.98",
    }
    i = Interaction.model_validate(data)
    assert i.interactor_A.gene_name == "BRCA1"
    assert i.score == "0.98"


def test_dataset_from_dict():
    data = {
        "id": 5,
        "name": "YeRI dataset",
        "pubmed_id": "12345678",
        "author": "Foo et al.",
        "year": "2020",
        "number_of_interactions": "1200",
    }
    d = Dataset.model_validate(data)
    assert d.name == "YeRI dataset"


def test_network_data_nodes_and_edges():
    data = {
        "nodes": [{"data": {"id": "1", "label": "BRCA1"}}],
        "edges": [{"data": {"source": "1", "target": "2", "weight": 0.9}}],
    }
    n = NetworkData.model_validate(data)
    assert len(n.nodes) == 1
    assert len(n.edges) == 1
