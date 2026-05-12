import pytest
from admin_panel.models import AdminSettings, Announcement


@pytest.mark.django_db
def test_get_settings_returns_camel_case(api_client):
    AdminSettings.objects.create(
        pk=1,
        title='My Portal',
        short_title='MP',
        main_color_scheme='#ff0000',
        header_color_scheme='#ffffff',
        logo_color_scheme='#000000',
        button_color_scheme='#ff0000',
        query_node_color='#ff0000',
        interactor_node_color='#0000ff',
        published_edge_color='#00ff00',
        validated_edge_color='#0000ff',
        verified_edge_color='#ff0000',
        literature_edge_color='#ff9900',
        url='http://localhost',
        version='2.0',
    )
    response = api_client.get('/api/settings')
    assert response.status_code == 200
    data = response.json()
    assert data['title'] == 'My Portal'
    assert data['shortTitle'] == 'MP'
    assert data['mainColorScheme'] == '#ff0000'
    assert 'main_color_scheme' not in data


@pytest.mark.django_db
def test_patch_settings_requires_admin(api_client, user_auth_client):
    AdminSettings.objects.create(pk=1, title='Old Title')
    response = user_auth_client.patch('/api/settings', {'title': 'New Title'}, format='json')
    assert response.status_code == 403


@pytest.mark.django_db
def test_patch_settings_as_admin(auth_client):
    AdminSettings.objects.create(pk=1, title='Old Title')
    response = auth_client.patch('/api/settings', {'title': 'New Title'}, format='json')
    assert response.status_code == 200
    assert response.json()['title'] == 'New Title'


@pytest.mark.django_db
def test_get_announcements_returns_home_page_announcements(api_client):
    Announcement.objects.create(title='Shown', text='Hello', show_on_home_page=True)
    Announcement.objects.create(title='Hidden', text='World', show_on_home_page=False)
    response = api_client.get('/api/announcements')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]['title'] == 'Shown'
    assert 'showOnHomePage' in data[0]


@pytest.mark.django_db
def test_get_counts(api_client):
    from proteins.models import Protein
    from interactions.models import Interaction
    p1 = Protein.objects.create(gene_name='A')
    p2 = Protein.objects.create(gene_name='B')
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed='0')
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed='1')
    response = api_client.get('/api/counts')
    assert response.status_code == 200
    data = response.json()
    assert data['proteins'] == 2
    assert data['interactions'] == 1
