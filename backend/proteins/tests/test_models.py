import pytest


@pytest.mark.django_db
def test_organism_scientific_name_defaults_to_null():
    from proteins.models import Organism

    org = Organism.objects.create(taxonomy_id="9606", name="human")
    assert org.scientific_name is None


@pytest.mark.django_db
def test_organism_scientific_name_can_be_set():
    from proteins.models import Organism

    org = Organism.objects.create(
        taxonomy_id="9606", name="human", scientific_name="Homo sapiens"
    )
    org.refresh_from_db()
    assert org.scientific_name == "Homo sapiens"
