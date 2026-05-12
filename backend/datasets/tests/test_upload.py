import io
import pytest
from proteins.models import Protein, Identifier, ProteinIdentifier
from interactions.models import Interaction

PSI_MI_CONTENT = b"""#id_A\tid_B
uniprotkb:Q92934\tuniprotkb:Q07817
uniprotkb:Q07817\tuniprotkb:Q16611
"""


@pytest.mark.django_db
def test_upload_requires_admin(user_auth_client):
    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = "test.tab"
    response = user_auth_client.post("/api/upload/", {"file": f}, format="multipart")
    assert response.status_code == 403


@pytest.mark.django_db
def test_upload_psi_mi_creates_interactions(auth_client):
    Protein.objects.create(id=100, gene_name="BAD", uniprot_id="Q92934")
    i1 = Identifier.objects.create(identifier="Q92934", naming_convention="uniprotkb")
    p1 = Protein.objects.get(uniprot_id="Q92934")
    ProteinIdentifier.objects.create(protein=p1, identifier=i1)

    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = "test.tab"
    response = auth_client.post("/api/upload/", {"file": f}, format="multipart")
    assert response.status_code == 200
    assert Interaction.objects.count() >= 1
    assert Protein.objects.filter(uniprot_id="Q07817").exists()


@pytest.mark.django_db
def test_upload_skips_duplicate_interactions(auth_client):
    p1 = Protein.objects.create(gene_name="A", uniprot_id="P00001")
    p2 = Protein.objects.create(gene_name="B", uniprot_id="P00002")
    Identifier.objects.create(identifier="P00001", naming_convention="uniprotkb")
    Identifier.objects.create(identifier="P00002", naming_convention="uniprotkb")
    i1 = Identifier.objects.get(identifier="P00001")
    i2 = Identifier.objects.get(identifier="P00002")
    ProteinIdentifier.objects.create(protein=p1, identifier=i1)
    ProteinIdentifier.objects.create(protein=p2, identifier=i2)
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed="0")

    content = b"#h\nP00001\tP00002\n"
    f = io.BytesIO(content)
    f.name = "test.tab"
    auth_client.post("/api/upload/", {"file": f}, format="multipart")
    assert Interaction.objects.filter(interactor_A=p1, interactor_B=p2).count() == 1
