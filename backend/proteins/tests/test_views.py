import pytest
from proteins.tests.factories import ProteinFactory, IdentifierFactory, ProteinIdentifierFactory


@pytest.mark.django_db
def test_autocomplete_returns_matching_gene_names(api_client):
    p1 = ProteinFactory(gene_name='BAD')
    p2 = ProteinFactory(gene_name='BAK1')
    p3 = ProteinFactory(gene_name='TP53')
    i1 = IdentifierFactory(identifier='BAD', naming_convention='gene_name')
    i2 = IdentifierFactory(identifier='BAK1', naming_convention='gene_name')
    i3 = IdentifierFactory(identifier='TP53', naming_convention='gene_name')
    ProteinIdentifierFactory(protein=p1, identifier=i1)
    ProteinIdentifierFactory(protein=p2, identifier=i2)
    ProteinIdentifierFactory(protein=p3, identifier=i3)

    response = api_client.get('/api/proteins/autocomplete?q=BA')
    assert response.status_code == 200
    data = response.json()
    assert 'BAD' in data
    assert 'BAK1' in data
    assert 'TP53' not in data


@pytest.mark.django_db
def test_autocomplete_case_insensitive(api_client):
    p = ProteinFactory(gene_name='BRCA1')
    i = IdentifierFactory(identifier='BRCA1', naming_convention='gene_name')
    ProteinIdentifierFactory(protein=p, identifier=i)

    response = api_client.get('/api/proteins/autocomplete?q=brca')
    assert response.status_code == 200
    assert 'BRCA1' in response.json()
