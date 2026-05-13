# Django Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Django 5 + DRF backend for openPIP 2.0 that satisfies every frontend API contract defined in `docs/BACKEND_DOCUMENTATION.md` and the frontend MSW handlers.

**Architecture:** Five Django apps (`core`, `proteins`, `interactions`, `datasets`, `admin_panel`) with shared settings split into base/dev/prod. Models mirror the legacy MySQL schema exactly (same table and column names); serializers produce camelCase for settings/announcements and snake_case for search/datasets per the frontend contract. The complex search algorithm is implemented as a plain-Python service function called from the search view.

**Tech Stack:** Django 5, Django REST Framework, djangorestframework-simplejwt, django-environ, django-filter, django-cors-headers, psycopg2-binary, pytest-django, factory-boy.

## Grilling decisions (locked)

| # | Decision |
|---|---|
| 1 | Backend runs on **port 8001** (port 8000 is live production PHP) |
| 2 | Python venv at `backend/.venv` — created in Task 1 |
| 3 | Tests run against **Postgres** — `docker compose up -d db` required before `pytest` |
| 4 | Found/unfound summary separator is `<br>` (matches frontend fixture) |
| 5 | Fix legacy `removed` filter bug — `removed='0'` guard applies to the full queryset before OR split |
| 6 | Annotation behaviour matches legacy — all types in `annotation_array`; `tissue_expression_array` and `subcellular_location_expression_array` return empty `{}` |
| 7 | No server-side score/category filtering — backend returns unfiltered results, frontend filters client-side |
| 8 | Interaction `annotation_array` is `{type: [list_of_json_strings]}` not `{type: single_string}` |
| 9 | Data migration: standalone script `migration/migrate_legacy.py` — reads from `mysql8` container via `docker exec`, bulk-loads into Postgres via `psycopg2 COPY` |
| 10 | Seed fixture `initial_data.json` is dev-only fallback — not loaded when migration script has run |
| 11 | `tdd` skill used during Task 9 execution; `parity-test` skill run after Tasks 6, 7, 9 |

---

## File Map

```
backend/
├── requirements.txt
├── manage.py
├── pytest.ini
├── .env.example
├── conftest.py                         ← shared pytest fixtures
├── openpip/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py                         ← root URL conf (all /api/ routes)
│   └── wsgi.py
├── core/
│   ├── __init__.py
│   ├── models.py                       ← User (AbstractUser), UserDataset, UserInteractionNetwork, UserProtein
│   ├── serializers.py                  ← UserSerializer
│   ├── views.py                        ← LoginView, LogoutView, RegisterView, MeView, ContactView
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── tests/
│       ├── __init__.py
│       └── test_views.py
├── proteins/
│   ├── __init__.py
│   ├── models.py                       ← Protein, Identifier, ProteinIdentifier, Organism, ProteinOrganism, ProteinIsoform, Domain, DomainOrganism, Complex, ComplexProtein, Annotation, AnnotationType, AnnotationProtein, ExternalLink
│   ├── serializers.py                  ← ProteinNestedSerializer (used inside interactions)
│   ├── views.py                        ← AutocompleteView
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── tests/
│       ├── __init__.py
│       ├── factories.py
│       └── test_views.py
├── interactions/
│   ├── __init__.py
│   ├── models.py                       ← Interaction, InteractionCategory, InteractionDataset, InteractionInteractionCategory, InteractionDomain, InteractionNetwork, InteractionInteractionNetworks, AnnotationInteraction, SupportInformation, InteractionSupportInformation
│   ├── search_service.py               ← search algorithm (pure function, no HTTP)
│   ├── views.py                        ← SearchView, SearchInteractorsView
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── tests/
│       ├── __init__.py
│       ├── factories.py
│       └── test_views.py
├── datasets/
│   ├── __init__.py
│   ├── models.py                       ← Dataset, DataFile, DatasetRequest, DatasetRequestDataset, UploadFiles
│   ├── serializers.py                  ← DatasetSerializer
│   ├── views.py                        ← DatasetListView, DatasetFileDownloadView, DatasetArchiveDownloadView, UploadView
│   ├── urls.py
│   ├── admin.py
│   ├── migrations/
│   └── tests/
│       ├── __init__.py
│       ├── factories.py
│       └── test_views.py
└── admin_panel/
    ├── __init__.py
    ├── models.py                       ← AdminSettings, Announcement
    ├── serializers.py                  ← AdminSettingsSerializer (camelCase), AnnouncementSerializer (camelCase)
    ├── views.py                        ← AdminSettingsView, AnnouncementListView, CountsView
    ├── urls.py
    ├── admin.py
    ├── fixtures/
    │   └── initial_data.json           ← seeds AdminSettings(id=1) + 4 InteractionCategory rows
    ├── migrations/
    └── tests/
        ├── __init__.py
        └── test_views.py
```

Also at project root:
```
docker-compose.yml
.env.example
```

Also in migration directory:
```
migration/
├── migrate_legacy.py        ← one-time MySQL→Postgres data migration script
└── requirements.txt         ← pymysql, psycopg2-binary (separate from backend deps)
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/manage.py`
- Create: `backend/openpip/__init__.py`
- Create: `backend/openpip/settings/__init__.py`
- Create: `backend/openpip/settings/base.py`
- Create: `backend/openpip/settings/dev.py`
- Create: `backend/openpip/settings/prod.py`
- Create: `backend/openpip/wsgi.py`
- Create: `backend/pytest.ini`
- Create: `backend/.env.example`
- Create: `backend/conftest.py`
- Create: app skeleton dirs (5 apps)

- [ ] **Step 1.1: Write requirements.txt**

```
# backend/requirements.txt
Django==5.0.6
djangorestframework==3.15.2
djangorestframework-simplejwt==5.3.1
django-environ==0.11.2
django-filter==24.2
django-cors-headers==4.4.0
psycopg2-binary==2.9.9
pytest==8.2.2
pytest-django==4.8.1
factory-boy==3.3.0
```

- [ ] **Step 1.2: Create virtual environment and install dependencies**

Run from `backend/`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Add to `backend/.gitignore`:
```
.venv/
__pycache__/
*.pyc
dev.db
```

Expected: all packages install without errors. Activate `.venv` before every subsequent `python`/`pytest` command.

- [ ] **Step 1.3: Write manage.py**

```python
# backend/manage.py
#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'openpip.settings.dev')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
```

- [ ] **Step 1.4: Write settings/base.py**

```python
# backend/openpip/settings/base.py
from pathlib import Path
from datetime import timedelta
import environ

env = environ.Env()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('SECRET_KEY', default='django-insecure-dev-key-change-in-production')

DEBUG = False

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'core',
    'proteins',
    'interactions',
    'datasets',
    'admin_panel',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'openpip.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'openpip.wsgi.application'

DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///dev.db'),
}

AUTH_USER_MODEL = 'core.User'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 50,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
```

- [ ] **Step 1.5: Write settings/dev.py**

```python
# backend/openpip/settings/dev.py
from .base import *  # noqa: F401, F403

environ.Env.read_env(BASE_DIR.parent / '.env')  # reads ~/openpip-2.0/.env

DEBUG = True
ALLOWED_HOSTS = ['*']
CORS_ALLOW_ALL_ORIGINS = True

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

- [ ] **Step 1.6: Write settings/prod.py**

```python
# backend/openpip/settings/prod.py
from .base import *  # noqa: F401, F403

SECURE_HSTS_SECONDS = 3600
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='localhost')
EMAIL_PORT = env.int('EMAIL_PORT', default=25)
```

- [ ] **Step 1.7: Write wsgi.py**

```python
# backend/openpip/wsgi.py
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'openpip.settings.prod')
application = get_wsgi_application()
```

- [ ] **Step 1.8: Write openpip/__init__.py and settings/__init__.py**

Both are empty files.

- [ ] **Step 1.9: Write pytest.ini**

Tests always run against Postgres. `docker compose up -d db` must be running before `pytest`.

```ini
# backend/pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = openpip.settings.dev
pythonpath = .
DATABASE_URL = postgres://openpip:openpip@localhost:5432/openpip_test
```

The `openpip_test` database will be auto-created by pytest-django. The Postgres container must be reachable at `localhost:5432` (mapped from `docker-compose.yml` Task 12).

- [ ] **Step 1.10: Write .env.example**

```
# backend/.env.example
SECRET_KEY=django-insecure-dev-key-change-in-production
DATABASE_URL=postgres://openpip:openpip@localhost:5432/openpip
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Copy this to `.env` in `~/openpip-2.0/`:
```bash
cp backend/.env.example ~/openpip-2.0/.env
```

- [ ] **Step 1.11: Write conftest.py**

```python
# backend/conftest.py
import pytest


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def admin_user(db):
    from core.models import User
    return User.objects.create_superuser('admin', 'admin@example.com', 'adminpass123')


@pytest.fixture
def regular_user(db):
    from core.models import User
    return User.objects.create_user('testuser', 'test@example.com', 'testpass123')


@pytest.fixture
def auth_client(api_client, admin_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client


@pytest.fixture
def user_auth_client(api_client, regular_user):
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(regular_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return api_client
```

- [ ] **Step 1.12: Create app skeleton directories**

Run from `backend/`:
```bash
python manage.py startapp core
python manage.py startapp proteins
python manage.py startapp interactions
python manage.py startapp datasets
python manage.py startapp admin_panel

# Create tests packages in each app
mkdir -p core/tests proteins/tests interactions/tests datasets/tests admin_panel/tests
touch core/tests/__init__.py proteins/tests/__init__.py interactions/tests/__init__.py datasets/tests/__init__.py admin_panel/tests/__init__.py
mkdir -p admin_panel/fixtures
mkdir -p interactions  # ensure search_service.py has a home
```

- [ ] **Step 1.13: Write openpip/urls.py (stub — will be filled in Task 11)**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
]
```

- [ ] **Step 1.14: Verify Django check passes**

Run from `backend/`:
```bash
python manage.py check
```

Expected output:
```
System check identified no issues (0 silenced).
```

If it errors with "No module named 'core'" — confirm all five startapp commands ran.

- [ ] **Step 1.15: Commit**

```bash
git add backend/
git commit -m "feat: scaffold Django 5 + DRF project structure"
```

---

## Task 2: proteins/models.py

**Files:**
- Create: `backend/proteins/models.py`
- Create: `backend/proteins/admin.py`
- Create: `backend/proteins/tests/factories.py`

- [ ] **Step 2.1: Write proteins/models.py**

```python
# backend/proteins/models.py
from django.db import models


class Protein(models.Model):
    gene_name = models.CharField(max_length=100, null=True, db_index=True)
    protein_name = models.CharField(max_length=200, null=True)
    uniprot_id = models.CharField(max_length=100, null=True, db_index=True)
    ensembl_id = models.CharField(max_length=100, null=True)
    entrez_id = models.CharField(max_length=100, null=True)
    sequence = models.TextField(null=True)
    description = models.CharField(max_length=10000, null=True)
    number_of_interactions_in_database = models.IntegerField(null=True)

    class Meta:
        db_table = 'protein'

    def __str__(self):
        return self.gene_name or self.uniprot_id or str(self.pk)


class Identifier(models.Model):
    identifier = models.CharField(max_length=100, null=True, db_index=True)
    naming_convention = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'identifier'

    def __str__(self):
        return self.identifier or str(self.pk)


class ProteinIdentifier(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='protein_identifiers')
    identifier = models.ForeignKey(Identifier, on_delete=models.CASCADE, db_column='identifier_id',
                                   related_name='protein_identifiers')

    class Meta:
        db_table = 'protein_identifier'


class Organism(models.Model):
    name = models.CharField(max_length=200)
    taxonomy_id = models.CharField(max_length=100)

    class Meta:
        db_table = 'organism'

    def __str__(self):
        return self.name


class ProteinOrganism(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='protein_organisms')
    organism = models.ForeignKey(Organism, on_delete=models.CASCADE, db_column='organism_id',
                                 related_name='protein_organisms')

    class Meta:
        db_table = 'protein_organism'


class ProteinIsoform(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='isoform_links')
    isoform = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='isoform_id',
                                related_name='isoform_of_links')

    class Meta:
        db_table = 'protein_isoform'


class Domain(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='domains')
    type = models.CharField(max_length=100, null=True)
    name = models.CharField(max_length=100, null=True)
    start_position = models.CharField(max_length=100, null=True)
    end_position = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=100, null=True)
    sequence = models.CharField(max_length=1000, null=True)

    class Meta:
        db_table = 'domain'

    def __str__(self):
        return self.name or str(self.pk)


class Complex(models.Model):
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, null=True)

    class Meta:
        db_table = 'complex'

    def __str__(self):
        return self.name


class ComplexProtein(models.Model):
    complex = models.ForeignKey(Complex, on_delete=models.CASCADE, db_column='complex_id',
                                related_name='complex_proteins')
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='complex_proteins')

    class Meta:
        db_table = 'complex_protein'


class AnnotationType(models.Model):
    type = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    description = models.TextField()
    fields = models.TextField()
    show_in_filter = models.CharField(max_length=10)
    show_in_table = models.CharField(max_length=10)

    class Meta:
        db_table = 'annotation_type'

    def __str__(self):
        return self.label


class Annotation(models.Model):
    annotation = models.CharField(max_length=5000, null=True)
    identifier = models.IntegerField(null=True)
    annotation_type = models.IntegerField(null=True)
    type_name = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'annotation'

    def __str__(self):
        return self.type_name or str(self.pk)


class AnnotationProtein(models.Model):
    annotation = models.ForeignKey(Annotation, on_delete=models.CASCADE, db_column='annotation_id',
                                   related_name='annotation_proteins')
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='annotation_proteins')

    class Meta:
        db_table = 'annotation_protein'


class ExternalLink(models.Model):
    protein = models.ForeignKey(Protein, on_delete=models.CASCADE, db_column='protein_id',
                                related_name='external_links')
    url = models.TextField()
    name = models.CharField(max_length=200)

    class Meta:
        db_table = 'external_link'

    def __str__(self):
        return self.name
```

- [ ] **Step 2.2: Write proteins/admin.py**

```python
# backend/proteins/admin.py
from django.contrib import admin
from .models import Protein, Identifier, Organism, Domain, Annotation, AnnotationType

admin.site.register(Protein)
admin.site.register(Identifier)
admin.site.register(Organism)
admin.site.register(Domain)
admin.site.register(Annotation)
admin.site.register(AnnotationType)
```

- [ ] **Step 2.3: Write proteins/tests/factories.py**

```python
# backend/proteins/tests/factories.py
import factory
from proteins.models import Protein, Identifier, ProteinIdentifier, Organism


class ProteinFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Protein

    gene_name = factory.Sequence(lambda n: f'GENE{n}')
    protein_name = factory.Sequence(lambda n: f'Protein {n}')
    uniprot_id = factory.Sequence(lambda n: f'P{n:05d}')
    ensembl_id = factory.Sequence(lambda n: f'ENSG{n:011d}')
    entrez_id = factory.Sequence(lambda n: str(n + 1000))
    sequence = 'MSEQSEQ'
    description = 'Test protein'
    number_of_interactions_in_database = 0


class IdentifierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Identifier

    identifier = factory.Sequence(lambda n: f'IDENT{n}')
    naming_convention = 'gene_name'


class ProteinIdentifierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProteinIdentifier

    protein = factory.SubFactory(ProteinFactory)
    identifier = factory.SubFactory(IdentifierFactory)


class OrganismFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organism

    name = 'Homo sapiens'
    taxonomy_id = '9606'
```

- [ ] **Step 2.4: Commit**

```bash
git add backend/proteins/
git commit -m "feat: add proteins app models (Protein, Identifier, Organism, Domain, Annotation, etc.)"
```

---

## Task 3: interactions/models.py

**Files:**
- Create: `backend/interactions/models.py`
- Create: `backend/interactions/admin.py`
- Create: `backend/interactions/tests/factories.py`

- [ ] **Step 3.1: Write interactions/models.py**

```python
# backend/interactions/models.py
from django.db import models
from proteins.models import Protein, Annotation, Domain


class InteractionCategory(models.Model):
    admin_settings = models.ForeignKey(
        'admin_panel.AdminSettings',
        on_delete=models.SET_NULL,
        null=True,
        db_column='admin_settings_id',
        related_name='interaction_categories',
    )
    category_name = models.CharField(max_length=200, null=True)
    order = models.CharField(max_length=200, null=True)
    color_scheme = models.CharField(max_length=200, null=True)
    description = models.CharField(max_length=1000, null=True)
    selected_by_default = models.CharField(max_length=10, null=True)
    include_in_home_page_count = models.CharField(max_length=10, null=True)

    class Meta:
        db_table = 'interaction_category'

    def __str__(self):
        return self.category_name or str(self.pk)


class Interaction(models.Model):
    interactor_A = models.ForeignKey(
        Protein,
        on_delete=models.CASCADE,
        db_column='interactor_A',
        related_name='interactions_as_A',
    )
    interactor_B = models.ForeignKey(
        Protein,
        on_delete=models.CASCADE,
        db_column='interactor_B',
        related_name='interactions_as_B',
    )
    score = models.CharField(max_length=10, null=True)
    binding_start = models.CharField(max_length=10, null=True)
    binding_end = models.CharField(max_length=10, null=True)
    removed = models.CharField(max_length=10, default='0')
    domain = models.IntegerField(null=True)

    class Meta:
        db_table = 'interaction'

    def __str__(self):
        return f'{self.interactor_A} — {self.interactor_B}'


class InteractionDataset(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column='interaction_id',
        related_name='interaction_datasets',
    )
    dataset = models.ForeignKey(
        'datasets.Dataset',
        on_delete=models.CASCADE,
        db_column='dataset_id',
        related_name='interaction_datasets',
    )

    class Meta:
        db_table = 'interaction_dataset'


class InteractionInteractionCategory(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column='interaction_id',
        related_name='interaction_categories',
    )
    interaction_category = models.ForeignKey(
        InteractionCategory,
        on_delete=models.CASCADE,
        db_column='interaction_category_id',
        related_name='interaction_categories',
    )

    class Meta:
        db_table = 'interaction_interaction_category'


class InteractionDomain(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column='interaction_id',
        related_name='interaction_domains',
    )
    domain = models.ForeignKey(
        Domain,
        on_delete=models.CASCADE,
        db_column='domain_id',
        related_name='interaction_domains',
    )

    class Meta:
        db_table = 'interaction_domain'


class AnnotationInteraction(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column='interaction_id',
        related_name='annotation_interactions',
    )
    annotation = models.ForeignKey(
        Annotation,
        on_delete=models.CASCADE,
        db_column='annotation_id',
        related_name='annotation_interactions',
    )

    class Meta:
        db_table = 'annotation_interaction'


class InteractionNetwork(models.Model):
    name = models.CharField(max_length=100, null=True)
    interactor_query_string = models.CharField(max_length=3000, null=True)
    score_parameter = models.CharField(max_length=100, null=True)
    category_array = models.CharField(max_length=100, null=True)
    tissue_expression_array = models.CharField(max_length=100, null=True)
    query = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'interaction_network'

    def __str__(self):
        return self.name or str(self.pk)


class InteractionInteractionNetworks(models.Model):
    interaction_network = models.ForeignKey(
        InteractionNetwork,
        on_delete=models.CASCADE,
        db_column='interaction_network_id',
        related_name='network_interactions',
    )
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        db_column='interaction_id',
        related_name='network_memberships',
    )

    class Meta:
        db_table = 'interaction_interaction_networks'


class SupportInformation(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'support_information'

    def __str__(self):
        return self.name


class InteractionSupportInformation(models.Model):
    interaction = models.ForeignKey(
        Interaction,
        on_delete=models.CASCADE,
        null=True,
        db_column='interaction_id',
        related_name='support_info',
    )
    support_information = models.ForeignKey(
        SupportInformation,
        on_delete=models.CASCADE,
        null=True,
        db_column='support_information_id',
        related_name='interaction_support',
    )
    value = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'interaction_support_information'
```

- [ ] **Step 3.2: Write interactions/admin.py**

```python
# backend/interactions/admin.py
from django.contrib import admin
from .models import Interaction, InteractionCategory, InteractionNetwork

admin.site.register(Interaction)
admin.site.register(InteractionCategory)
admin.site.register(InteractionNetwork)
```

- [ ] **Step 3.3: Write interactions/tests/factories.py**

```python
# backend/interactions/tests/factories.py
import factory
from interactions.models import Interaction, InteractionCategory, InteractionDataset, InteractionInteractionCategory
from proteins.tests.factories import ProteinFactory


class InteractionCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionCategory

    category_name = 'Published'
    order = '1'
    selected_by_default = '1'
    include_in_home_page_count = '1'


class InteractionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Interaction

    interactor_A = factory.SubFactory(ProteinFactory)
    interactor_B = factory.SubFactory(ProteinFactory)
    score = '0.75'
    removed = '0'


class InteractionDatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionDataset

    interaction = factory.SubFactory(InteractionFactory)


class InteractionInteractionCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = InteractionInteractionCategory

    interaction = factory.SubFactory(InteractionFactory)
    interaction_category = factory.SubFactory(InteractionCategoryFactory)
```

- [ ] **Step 3.4: Commit**

```bash
git add backend/interactions/
git commit -m "feat: add interactions app models (Interaction, InteractionCategory, InteractionNetwork, etc.)"
```

---

## Task 4: datasets, admin_panel, core models

**Files:**
- Create: `backend/datasets/models.py`
- Create: `backend/datasets/admin.py`
- Create: `backend/admin_panel/models.py`
- Create: `backend/admin_panel/admin.py`
- Create: `backend/core/models.py`
- Create: `backend/core/admin.py`
- Create: `backend/datasets/tests/factories.py`

- [ ] **Step 4.1: Write datasets/models.py**

```python
# backend/datasets/models.py
from django.db import models


class Dataset(models.Model):
    name = models.CharField(max_length=100, null=True)
    pubmed_id = models.CharField(max_length=100, null=True)
    author = models.CharField(max_length=100, null=True)
    year = models.CharField(max_length=10, null=True)
    interaction_status = models.CharField(max_length=100, null=True)
    description = models.CharField(max_length=1000, null=True)
    number_of_interactions = models.CharField(max_length=100, null=True)
    file_path = models.CharField(max_length=100, null=True)

    class Meta:
        db_table = 'dataset'

    def __str__(self):
        return self.name or str(self.pk)


class DataFile(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, db_column='dataset_id',
                                related_name='data_files')
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)

    class Meta:
        db_table = 'data_file'

    def __str__(self):
        return self.file_name


class DatasetRequest(models.Model):
    email = models.EmailField()
    request = models.TextField()
    md5 = models.CharField(max_length=32, null=True)

    class Meta:
        db_table = 'dataset_request'


class DatasetRequestDataset(models.Model):
    dataset_request = models.ForeignKey(
        DatasetRequest,
        on_delete=models.CASCADE,
        db_column='dataset_request_id',
        related_name='request_datasets',
    )
    dataset = models.ForeignKey(
        Dataset,
        on_delete=models.CASCADE,
        db_column='dataset_id',
        related_name='dataset_requests',
    )

    class Meta:
        db_table = 'dataset_request_dataset'


class UploadFiles(models.Model):
    file_name = models.CharField(max_length=200)
    file_path = models.CharField(max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'upload_files'

    def __str__(self):
        return self.file_name
```

- [ ] **Step 4.2: Write datasets/admin.py**

```python
# backend/datasets/admin.py
from django.contrib import admin
from .models import Dataset, DataFile

admin.site.register(Dataset)
admin.site.register(DataFile)
```

- [ ] **Step 4.3: Write datasets/tests/factories.py**

```python
# backend/datasets/tests/factories.py
import factory
from datasets.models import Dataset


class DatasetFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Dataset

    name = factory.Sequence(lambda n: f'Dataset{n}')
    pubmed_id = factory.Sequence(lambda n: f'{2000000 + n}')
    author = factory.Sequence(lambda n: f'Author{n} et al.(2020)')
    year = '2020'
    interaction_status = 'Published'
    description = 'Test dataset'
    number_of_interactions = '100'
```

- [ ] **Step 4.4: Write admin_panel/models.py**

```python
# backend/admin_panel/models.py
from django.db import models


class AdminSettings(models.Model):
    title = models.CharField(max_length=200, null=True)
    short_title = models.CharField(max_length=200, null=True)
    url = models.CharField(max_length=200, null=True)
    version = models.CharField(max_length=200, null=True)
    home_page = models.TextField(null=True)
    mission_title = models.TextField(null=True)      # new in 2.0 (not in legacy)
    mission_text = models.TextField(null=True)       # new in 2.0
    method_title = models.TextField(null=True)       # new in 2.0
    method_text = models.TextField(null=True)        # new in 2.0
    about = models.TextField(null=True)
    faq = models.TextField(null=True)
    download = models.TextField(null=True)
    contact = models.TextField(null=True)
    show_downloads = models.BooleanField(default=False)
    show_download_all = models.BooleanField(default=False)
    footer = models.TextField(null=True)
    main_color_scheme = models.CharField(max_length=10, null=True)
    header_color_scheme = models.CharField(max_length=10, null=True)
    logo_color_scheme = models.CharField(max_length=10, null=True)
    button_color_scheme = models.CharField(max_length=10, null=True)
    example_1 = models.CharField(max_length=100, null=True)
    example_2 = models.CharField(max_length=100, null=True)
    example_3 = models.CharField(max_length=100, null=True)
    query_node_color = models.CharField(max_length=20, null=True)
    interactor_node_color = models.CharField(max_length=20, null=True)
    published_edge_color = models.CharField(max_length=20, null=True)
    validated_edge_color = models.CharField(max_length=20, null=True)
    verified_edge_color = models.CharField(max_length=20, null=True)
    literature_edge_color = models.CharField(max_length=20, null=True)

    class Meta:
        db_table = 'admin_settings'
        verbose_name_plural = 'admin settings'

    def __str__(self):
        return self.title or 'AdminSettings'


class Announcement(models.Model):
    title = models.CharField(max_length=100)
    text = models.CharField(max_length=4000)
    date = models.DateTimeField(null=True)
    show = models.BooleanField(default=True)
    show_on_home_page = models.BooleanField(default=True)

    class Meta:
        db_table = 'announcement'

    def __str__(self):
        return self.title
```

- [ ] **Step 4.5: Write admin_panel/admin.py**

```python
# backend/admin_panel/admin.py
from django.contrib import admin
from .models import AdminSettings, Announcement

admin.site.register(AdminSettings)
admin.site.register(Announcement)
```

- [ ] **Step 4.6: Write core/models.py**

```python
# backend/core/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username


class UserDataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id',
                             related_name='user_datasets')
    dataset = models.ForeignKey('datasets.Dataset', on_delete=models.CASCADE, db_column='dataset_id',
                                related_name='user_datasets')

    class Meta:
        db_table = 'user_datasets'


class UserInteractionNetwork(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id',
                             related_name='user_networks')
    interaction_network = models.ForeignKey(
        'interactions.InteractionNetwork',
        on_delete=models.CASCADE,
        db_column='interaction_network_id',
        related_name='user_networks',
    )

    class Meta:
        db_table = 'user_interaction_networks'


class UserProtein(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column='user_id',
                             related_name='user_proteins')
    protein = models.ForeignKey('proteins.Protein', on_delete=models.CASCADE, db_column='protein_id',
                                related_name='user_proteins')

    class Meta:
        db_table = 'user_protein'
```

- [ ] **Step 4.7: Write core/admin.py**

```python
# backend/core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

admin.site.register(User, UserAdmin)
```

- [ ] **Step 4.8: Commit**

```bash
git add backend/datasets/ backend/admin_panel/ backend/core/
git commit -m "feat: add datasets, admin_panel, core app models"
```

---

## Task 5: Migrations + Seed Fixture

**Files:**
- Generate: `backend/*/migrations/0001_initial.py` (one per app)
- Create: `backend/admin_panel/fixtures/initial_data.json`

- [ ] **Step 5.1: Run makemigrations**

Run from `backend/` with `DATABASE_URL` pointing to a running Postgres instance (or leave it using sqlite for dev):

```bash
python manage.py makemigrations core
python manage.py makemigrations proteins
python manage.py makemigrations interactions
python manage.py makemigrations datasets
python manage.py makemigrations admin_panel
```

Expected: each command prints `Migrations for '<app>': 0001_initial.py`.

If you get `ValueError: Related model 'admin_panel.AdminSettings' cannot be resolved` — run `admin_panel` makemigrations first, then `interactions`.

The correct order: `admin_panel`, then `proteins`, then `interactions`, then `datasets`, then `core`.

- [ ] **Step 5.2: Verify no circular dependency**

```bash
python manage.py migrate --run-syncdb --check
```

If this errors, inspect the migration dependency chain. Most likely `interactions` needs to depend on `admin_panel` and `proteins`.

If Django auto-detected this correctly, skip. If not, open `interactions/migrations/0001_initial.py` and verify `dependencies` includes both `('admin_panel', '0001_initial')` and `('proteins', '0001_initial')`.

- [ ] **Step 5.3: Apply migrations**

Start a local Postgres instance if needed:
```bash
# From project root, start just the DB container:
cd ~/openpip-2.0
docker compose up -d db  # (docker-compose.yml will be created in Task 12 — skip this for now)

# OR use SQLite for dev testing:
# DATABASE_URL=sqlite:///dev.db is the default if DATABASE_URL env var is unset
```

```bash
cd ~/openpip-2.0/backend
python manage.py migrate
```

Expected: all migrations apply cleanly. Output ends with:
```
Applying admin_panel.0001_initial... OK
Applying core.0001_initial... OK
...
```

- [ ] **Step 5.4: Verify Django check passes**

```bash
python manage.py check
```

Expected: `System check identified no issues (0 silenced).`

- [ ] **Step 5.5: Write seed fixture**

```json
[
  {
    "model": "admin_panel.adminsettings",
    "pk": 1,
    "fields": {
      "title": "openPIP — Protein Interaction Portal",
      "short_title": "openPIP",
      "url": "http://localhost:8000",
      "version": "2.0",
      "home_page": "",
      "mission_title": "<h4>Our Mission</h4>",
      "mission_text": "<p>openPIP provides a curated map of human protein–protein interactions.</p>",
      "method_title": "<h4>Methods</h4>",
      "method_text": "<p>Interactions are sourced from published experimental datasets.</p>",
      "about": "",
      "faq": "",
      "download": "",
      "contact": "",
      "show_downloads": false,
      "show_download_all": false,
      "footer": "<p>© 2026 openPIP. All rights reserved.</p>",
      "main_color_scheme": "#a51c30",
      "header_color_scheme": "#ffffff",
      "logo_color_scheme": "#ffffff",
      "button_color_scheme": "#a51c30",
      "example_1": "BAD",
      "example_2": "BCL2L1",
      "example_3": "TP53",
      "query_node_color": "#cc0000",
      "interactor_node_color": "#3c78d8",
      "published_edge_color": "#38761d",
      "validated_edge_color": "#1155cc",
      "verified_edge_color": "#cc0000",
      "literature_edge_color": "#ff9900"
    }
  },
  {
    "model": "interactions.interactioncategory",
    "pk": 1,
    "fields": {
      "admin_settings": 1,
      "category_name": "Published",
      "order": "1",
      "color_scheme": "#38761d",
      "description": "Published interactions from peer-reviewed sources.",
      "selected_by_default": "1",
      "include_in_home_page_count": "1"
    }
  },
  {
    "model": "interactions.interactioncategory",
    "pk": 2,
    "fields": {
      "admin_settings": 1,
      "category_name": "Validated",
      "order": "2",
      "color_scheme": "#1155cc",
      "description": "Validated interactions from high-throughput experiments.",
      "selected_by_default": "1",
      "include_in_home_page_count": "1"
    }
  },
  {
    "model": "interactions.interactioncategory",
    "pk": 3,
    "fields": {
      "admin_settings": 1,
      "category_name": "Verified",
      "order": "3",
      "color_scheme": "#cc0000",
      "description": "Verified interactions with experimental evidence.",
      "selected_by_default": "1",
      "include_in_home_page_count": "1"
    }
  },
  {
    "model": "interactions.interactioncategory",
    "pk": 4,
    "fields": {
      "admin_settings": 1,
      "category_name": "Literature",
      "order": "4",
      "color_scheme": "#ff9900",
      "description": "Literature-curated interactions.",
      "selected_by_default": "1",
      "include_in_home_page_count": "1"
    }
  }
]
```

Save this to `backend/admin_panel/fixtures/initial_data.json`.

- [ ] **Step 5.6: Load seed data**

**Only run this if you are NOT running the migration script (Task 13).** The migration script populates `admin_settings` and `interaction_category` from the real legacy DB. Loading the fixture after migration would fail on duplicate PKs.

```bash
python manage.py loaddata admin_panel/fixtures/initial_data.json
```

Expected: `Installed 5 object(s) from 1 fixture(s).`

- [ ] **Step 5.7: Commit**

```bash
git add backend/
git commit -m "feat: add Django migrations and seed fixture for AdminSettings + InteractionCategory"
```

---

## Task 6: admin_panel Endpoints (settings, announcements, counts)

These are the simplest endpoints. No auth required for GET. Implement + test first since they have no dependencies on other views.

**Files:**
- Create: `backend/admin_panel/serializers.py`
- Create: `backend/admin_panel/views.py`
- Create: `backend/admin_panel/urls.py`
- Create: `backend/admin_panel/tests/test_views.py`

- [ ] **Step 6.1: Write failing tests**

```python
# backend/admin_panel/tests/test_views.py
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
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed='1')  # soft-deleted
    response = api_client.get('/api/counts')
    assert response.status_code == 200
    data = response.json()
    assert data['proteins'] == 2
    assert data['interactions'] == 1  # only removed='0'
```

- [ ] **Step 6.2: Run tests — verify they fail**

```bash
cd backend && pytest admin_panel/tests/test_views.py -v
```

Expected: `ERROR` or `ImportError` because views/urls don't exist yet.

- [ ] **Step 6.3: Write admin_panel/serializers.py**

```python
# backend/admin_panel/serializers.py
from rest_framework import serializers
from .models import AdminSettings, Announcement


class AdminSettingsSerializer(serializers.ModelSerializer):
    shortTitle = serializers.CharField(source='short_title', allow_null=True)
    homePage = serializers.CharField(source='home_page', allow_null=True)
    missionTitle = serializers.CharField(source='mission_title', allow_null=True)
    missionText = serializers.CharField(source='mission_text', allow_null=True)
    methodTitle = serializers.CharField(source='method_title', allow_null=True)
    methodText = serializers.CharField(source='method_text', allow_null=True)
    mainColorScheme = serializers.CharField(source='main_color_scheme', allow_null=True)
    headerColorScheme = serializers.CharField(source='header_color_scheme', allow_null=True)
    logoColorScheme = serializers.CharField(source='logo_color_scheme', allow_null=True)
    buttonColorScheme = serializers.CharField(source='button_color_scheme', allow_null=True)
    queryNodeColor = serializers.CharField(source='query_node_color', allow_null=True)
    interactorNodeColor = serializers.CharField(source='interactor_node_color', allow_null=True)
    publishedEdgeColor = serializers.CharField(source='published_edge_color', allow_null=True)
    validatedEdgeColor = serializers.CharField(source='validated_edge_color', allow_null=True)
    verifiedEdgeColor = serializers.CharField(source='verified_edge_color', allow_null=True)
    literatureEdgeColor = serializers.CharField(source='literature_edge_color', allow_null=True)

    class Meta:
        model = AdminSettings
        fields = [
            'title', 'shortTitle', 'footer', 'homePage',
            'missionTitle', 'missionText', 'methodTitle', 'methodText',
            'mainColorScheme', 'headerColorScheme', 'logoColorScheme', 'buttonColorScheme',
            'queryNodeColor', 'interactorNodeColor',
            'publishedEdgeColor', 'validatedEdgeColor', 'verifiedEdgeColor', 'literatureEdgeColor',
            'url', 'version',
        ]


class AnnouncementSerializer(serializers.ModelSerializer):
    showOnHomePage = serializers.BooleanField(source='show_on_home_page')

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'text', 'date', 'showOnHomePage']
```

- [ ] **Step 6.4: Write admin_panel/views.py**

```python
# backend/admin_panel/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status

from proteins.models import Protein
from interactions.models import Interaction
from .models import AdminSettings, Announcement
from .serializers import AdminSettingsSerializer, AnnouncementSerializer


class AdminSettingsView(APIView):
    def get_permissions(self):
        if self.request.method == 'PATCH':
            return [IsAdminUser()]
        return [AllowAny()]

    def get(self, request):
        settings = AdminSettings.objects.filter(pk=1).first()
        if not settings:
            return Response({}, status=status.HTTP_200_OK)
        return Response(AdminSettingsSerializer(settings).data)

    def patch(self, request):
        settings, _ = AdminSettings.objects.get_or_create(pk=1)
        serializer = AdminSettingsSerializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AnnouncementListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Announcement.objects.filter(show_on_home_page=True).order_by('-date')
        return Response(AnnouncementSerializer(qs, many=True).data)


class CountsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            'proteins': Protein.objects.count(),
            'interactions': Interaction.objects.filter(removed='0').count(),
        })
```

- [ ] **Step 6.5: Write admin_panel/urls.py**

```python
# backend/admin_panel/urls.py
from django.urls import path
from .views import AdminSettingsView, AnnouncementListView, CountsView

urlpatterns = [
    path('settings', AdminSettingsView.as_view()),
    path('announcements', AnnouncementListView.as_view()),
    path('counts', CountsView.as_view()),
]
```

- [ ] **Step 6.6: Wire into root URL conf**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
]
```

- [ ] **Step 6.7: Run tests — verify they pass**

```bash
pytest admin_panel/tests/test_views.py -v
```

Expected:
```
PASSED admin_panel/tests/test_views.py::test_get_settings_returns_camel_case
PASSED admin_panel/tests/test_views.py::test_patch_settings_requires_admin
PASSED admin_panel/tests/test_views.py::test_patch_settings_as_admin
PASSED admin_panel/tests/test_views.py::test_get_announcements_returns_home_page_announcements
PASSED admin_panel/tests/test_views.py::test_get_counts
```

- [ ] **Step 6.8: Run linters**

```bash
ruff check . && black --check .
```

Fix any issues before committing.

- [ ] **Step 6.9: Commit**

```bash
git add backend/admin_panel/ backend/openpip/urls.py
git commit -m "feat: add settings, announcements, counts endpoints with camelCase serialization"
```

---

## Task 7: Auth Endpoints (login, register, me, logout, contact)

**Files:**
- Create: `backend/core/serializers.py`
- Create: `backend/core/views.py`
- Create: `backend/core/urls.py`
- Create: `backend/core/tests/test_views.py`

- [ ] **Step 7.1: Write failing tests**

```python
# backend/core/tests/test_views.py
import pytest
from core.models import User


@pytest.mark.django_db
def test_login_returns_tokens_and_is_admin(api_client):
    User.objects.create_superuser('admin', 'admin@example.com', 'password123')
    response = api_client.post('/api/auth/login', {'username': 'admin', 'password': 'password123'}, format='json')
    assert response.status_code == 200
    data = response.json()
    assert 'access' in data
    assert 'refresh' in data
    assert data['is_admin'] is True


@pytest.mark.django_db
def test_login_invalid_credentials(api_client):
    response = api_client.post('/api/auth/login', {'username': 'nobody', 'password': 'wrong'}, format='json')
    assert response.status_code == 401
    assert response.json()['detail'] == 'Invalid credentials'


@pytest.mark.django_db
def test_register_creates_user(api_client):
    response = api_client.post('/api/auth/register', {
        'username': 'newuser', 'email': 'new@example.com', 'password': 'pass1234'
    }, format='json')
    assert response.status_code == 201
    assert User.objects.filter(username='newuser').exists()


@pytest.mark.django_db
def test_register_duplicate_username(api_client):
    User.objects.create_user('existing', 'e@example.com', 'pass')
    response = api_client.post('/api/auth/register', {
        'username': 'existing', 'email': 'other@example.com', 'password': 'pass1234'
    }, format='json')
    assert response.status_code == 400


@pytest.mark.django_db
def test_me_returns_user_info(user_auth_client, regular_user):
    response = user_auth_client.get('/api/auth/me')
    assert response.status_code == 200
    data = response.json()
    assert data['username'] == regular_user.username
    assert 'is_admin' in data


@pytest.mark.django_db
def test_me_requires_auth(api_client):
    response = api_client.get('/api/auth/me')
    assert response.status_code == 401


@pytest.mark.django_db
def test_contact_returns_200(api_client):
    response = api_client.post('/api/contact', {
        'name': 'Alice', 'email': 'alice@example.com', 'subject': 'Hello', 'message': 'Test'
    }, format='json')
    assert response.status_code == 200
    assert response.json()['detail'] == 'Message sent'
```

- [ ] **Step 7.2: Run tests — verify they fail**

```bash
pytest core/tests/test_views.py -v 2>&1 | head -20
```

Expected: errors because routes/views don't exist yet.

- [ ] **Step 7.3: Write core/views.py**

```python
# backend/core/views.py
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'is_admin': user.is_staff,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'Logged out'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '').strip()
        if not username or not email or not password:
            return Response({'detail': 'All fields required.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'detail': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
        User.objects.create_user(username=username, email=email, password=password)
        return Response({'detail': 'Registration successful'}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_staff,
        })


class ContactView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        subject = request.data.get('subject', '')
        message = request.data.get('message', '')
        # Phase 1: log to console. Phase 2: send email via Django mail backend.
        import logging
        logger = logging.getLogger(__name__)
        logger.info('Contact form: from=%s <%s> subject=%s', name, email, subject)
        return Response({'detail': 'Message sent'})
```

- [ ] **Step 7.4: Write core/urls.py**

```python
# backend/core/urls.py
from django.urls import path
from .views import LoginView, LogoutView, RegisterView, MeView, ContactView

urlpatterns = [
    path('auth/login', LoginView.as_view()),
    path('auth/logout', LogoutView.as_view()),
    path('auth/register', RegisterView.as_view()),
    path('auth/me', MeView.as_view()),
    path('contact', ContactView.as_view()),
]
```

- [ ] **Step 7.5: Add core URLs to root URL conf**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
    path('api/', include('core.urls')),
]
```

- [ ] **Step 7.6: Run tests — verify they pass**

```bash
pytest core/tests/test_views.py -v
```

Expected: all 7 tests pass.

- [ ] **Step 7.7: Run linters and commit**

```bash
ruff check . && black --check .
git add backend/core/
git commit -m "feat: add auth endpoints (login, register, me, logout, contact)"
```

---

## Task 8: Proteins Autocomplete + Datasets List

**Files:**
- Create: `backend/proteins/serializers.py`
- Create: `backend/proteins/views.py`
- Create: `backend/proteins/urls.py`
- Create: `backend/proteins/tests/test_views.py`
- Create: `backend/datasets/serializers.py`
- Create: `backend/datasets/views.py`
- Create: `backend/datasets/urls.py`
- Create: `backend/datasets/tests/test_views.py`

- [ ] **Step 8.1: Write failing tests**

```python
# backend/proteins/tests/test_views.py
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
```

```python
# backend/datasets/tests/test_views.py
import pytest
from datasets.tests.factories import DatasetFactory


@pytest.mark.django_db
def test_datasets_list_returns_dataset_refs(api_client):
    DatasetFactory(name='HuRI', pubmed_id='24153252', author='Rolland et al.(2014)',
                   year='2014', interaction_status='Published', description='Human Reference Interactome')
    DatasetFactory(name='Unpublished', pubmed_id='99999999', author=None,
                   year='2020', interaction_status='Validated', description='Unpublished set')

    response = api_client.get('/api/datasets')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

    huri = next(d for d in data if d['name'] == 'HuRI')
    assert huri['dataset_reference'] == '24153252'
    assert huri['dataset_author'] == 'Rolland et al.(2014)'
    assert huri['interaction_status'] == 'Published'

    unpub = next(d for d in data if d['name'] == 'Unpublished')
    assert unpub['dataset_author'] == 'Unpublished Dataset'
```

- [ ] **Step 8.2: Run tests — verify they fail**

```bash
pytest proteins/tests/test_views.py datasets/tests/test_views.py -v 2>&1 | head -20
```

- [ ] **Step 8.3: Write proteins/serializers.py**

This serializer is used when embedding proteins inside interaction edges.

```python
# backend/proteins/serializers.py
from rest_framework import serializers
from .models import Protein


class ProteinNestedSerializer(serializers.ModelSerializer):
    protein_id = serializers.IntegerField(source='id')
    protein_uniprot_id = serializers.CharField(source='uniprot_id', allow_null=True)
    protein_gene_name = serializers.CharField(source='gene_name', allow_null=True)
    protein_ensembl_id = serializers.CharField(source='ensembl_id', allow_null=True)

    class Meta:
        model = Protein
        fields = ['protein_id', 'protein_uniprot_id', 'protein_gene_name', 'protein_ensembl_id']
```

- [ ] **Step 8.4: Write proteins/views.py**

```python
# backend/proteins/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Identifier, ProteinIdentifier, Protein


class AutocompleteView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([])
        matching_identifiers = Identifier.objects.filter(
            identifier__icontains=q
        ).values_list('identifier', flat=True).distinct()[:20]
        return Response(list(matching_identifiers))
```

- [ ] **Step 8.5: Write proteins/urls.py**

```python
# backend/proteins/urls.py
from django.urls import path
from .views import AutocompleteView

urlpatterns = [
    path('proteins/autocomplete', AutocompleteView.as_view()),
]
```

- [ ] **Step 8.6: Write datasets/serializers.py**

```python
# backend/datasets/serializers.py
from rest_framework import serializers
from .models import Dataset


class DatasetSerializer(serializers.ModelSerializer):
    dataset_reference = serializers.SerializerMethodField()
    dataset_author = serializers.SerializerMethodField()
    interaction_status = serializers.CharField()

    class Meta:
        model = Dataset
        fields = ['dataset_reference', 'dataset_author', 'year', 'description', 'interaction_status', 'name']

    def get_dataset_reference(self, obj):
        return obj.pubmed_id or ''

    def get_dataset_author(self, obj):
        return obj.author if obj.author else 'Unpublished Dataset'
```

- [ ] **Step 8.7: Write datasets/views.py**

```python
# backend/datasets/views.py
import os
import tempfile
import zipfile

from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Dataset
from .serializers import DatasetSerializer


class DatasetListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        datasets = Dataset.objects.all().order_by('id')
        return Response(DatasetSerializer(datasets, many=True).data)


class DatasetFileDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dataset_reference):
        dataset = Dataset.objects.filter(pubmed_id=dataset_reference).first()
        if not dataset or not dataset.file_path:
            raise Http404
        if not os.path.exists(dataset.file_path):
            raise Http404
        return FileResponse(open(dataset.file_path, 'rb'), as_attachment=True,
                            filename=os.path.basename(dataset.file_path))


class DatasetArchiveDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        datasets = Dataset.objects.exclude(file_path__isnull=True).exclude(file_path='')
        tmp = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
        with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as zf:
            for ds in datasets:
                if ds.file_path and os.path.exists(ds.file_path):
                    zf.write(ds.file_path, arcname=os.path.basename(ds.file_path))
        tmp.seek(0)
        return FileResponse(open(tmp.name, 'rb'), as_attachment=True, filename='datasets.zip')
```

- [ ] **Step 8.8: Write datasets/urls.py**

```python
# backend/datasets/urls.py
from django.urls import path
from .views import DatasetListView, DatasetFileDownloadView, DatasetArchiveDownloadView

urlpatterns = [
    path('datasets', DatasetListView.as_view()),
    path('datasets/download/', DatasetArchiveDownloadView.as_view()),
    path('datasets/<str:dataset_reference>/download', DatasetFileDownloadView.as_view()),
]
```

- [ ] **Step 8.9: Update root URL conf**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
    path('api/', include('core.urls')),
    path('api/', include('proteins.urls')),
    path('api/', include('datasets.urls')),
]
```

- [ ] **Step 8.10: Run tests — verify they pass**

```bash
pytest proteins/tests/test_views.py datasets/tests/test_views.py -v
```

- [ ] **Step 8.11: Run linters and commit**

```bash
ruff check . && black --check .
git add backend/proteins/ backend/datasets/
git commit -m "feat: add autocomplete, datasets list, and dataset download endpoints"
```

---

## Task 9: Search Endpoint

This is the most complex task. The search algorithm is extracted into `search_service.py` (a pure Python function) and called from the views.

**Files:**
- Create: `backend/interactions/search_service.py`
- Create: `backend/interactions/views.py`
- Create: `backend/interactions/urls.py`
- Create: `backend/interactions/tests/test_views.py`

- [ ] **Step 9.1: Write failing tests**

```python
# backend/interactions/tests/test_views.py
import pytest
from proteins.tests.factories import ProteinFactory, IdentifierFactory, ProteinIdentifierFactory
from interactions.tests.factories import (
    InteractionFactory, InteractionCategoryFactory,
    InteractionDatasetFactory, InteractionInteractionCategoryFactory,
)
from datasets.tests.factories import DatasetFactory


def _make_protein_with_identifier(gene_name, uniprot_id='P00001'):
    protein = ProteinFactory(gene_name=gene_name, uniprot_id=uniprot_id)
    identifier = IdentifierFactory(identifier=gene_name, naming_convention='gene_name')
    ProteinIdentifierFactory(protein=protein, identifier=identifier)
    return protein


@pytest.mark.django_db
def test_search_returns_search_result_shape(api_client):
    _make_protein_with_identifier('BAD', 'Q92934')
    response = api_client.get('/api/search?q=BAD')
    assert response.status_code == 200
    data = response.json()
    assert 'all_proteins' in data
    assert 'all_interactions' in data
    assert 'query_protein_id_array' in data
    assert 'found_protein_summary' in data
    assert 'unfound_protein_summary' in data


@pytest.mark.django_db
def test_search_finds_proteins_case_insensitive(api_client):
    _make_protein_with_identifier('BRCA1')
    response = api_client.get('/api/search?q=brca1')
    assert response.status_code == 200
    data = response.json()
    assert len(data['all_proteins']) >= 1
    gene_names = [p['protein_gene_name'] for p in data['all_proteins']]
    assert 'BRCA1' in gene_names


@pytest.mark.django_db
def test_search_found_unfound_summary(api_client):
    _make_protein_with_identifier('BAD')
    response = api_client.get('/api/search?q=BAD,NOTFOUND')
    assert response.status_code == 200
    data = response.json()
    assert data['found_protein_summary'] == 'BAD'
    assert data['unfound_protein_summary'] == 'NOTFOUND'


@pytest.mark.django_db
def test_search_returns_interactions(api_client):
    p1 = _make_protein_with_identifier('BAD', 'Q92934')
    p2 = _make_protein_with_identifier('BCL2L1', 'Q07817')
    cat = InteractionCategoryFactory(category_name='Published', order='1')
    dataset = DatasetFactory(name='HuRI', pubmed_id='24153252', author='Rolland et al.(2014)',
                             year='2014', interaction_status='Published')
    ix = InteractionFactory(interactor_A=p1, interactor_B=p2, removed='0', score='0.82')
    InteractionInteractionCategoryFactory(interaction=ix, interaction_category=cat)

    from interactions.models import InteractionDataset
    InteractionDataset.objects.create(interaction=ix, dataset=dataset)

    response = api_client.get('/api/search?q=BAD,BCL2L1')
    assert response.status_code == 200
    data = response.json()
    assert len(data['all_interactions']) == 1
    ix_data = data['all_interactions'][0]
    assert ix_data['interactor_A']['protein_gene_name'] in ('BAD', 'BCL2L1')
    assert ix_data['score'] == 0.82
    assert len(ix_data['dataset_array']) == 1
    assert ix_data['dataset_array'][0]['name'] == 'HuRI'
    assert ix_data['interaction_category_array']['highest_category_status'] == 'Published'


@pytest.mark.django_db
def test_search_excludes_removed_interactions(api_client):
    p1 = _make_protein_with_identifier('BAD')
    p2 = _make_protein_with_identifier('BCL2L1')
    InteractionFactory(interactor_A=p1, interactor_B=p2, removed='1')
    response = api_client.get('/api/search?q=BAD,BCL2L1')
    assert response.status_code == 200
    assert len(response.json()['all_interactions']) == 0


@pytest.mark.django_db
def test_search_interactors_endpoint(api_client):
    p1 = _make_protein_with_identifier('BAD')
    p2 = _make_protein_with_identifier('BCL2L1')
    InteractionFactory(interactor_A=p1, interactor_B=p2, removed='0')
    response = api_client.post('/api/search/interactors', {
        'searchTerm': 'BAD,BCL2L1',
        'filterParameter': 'query_query',
        'searchTermArray': ['BAD', 'BCL2L1'],
        'queryIdArray': [p1.id, p2.id],
    }, format='json')
    assert response.status_code == 200
    data = response.json()
    assert 'all_proteins' in data
    assert 'all_interactions' in data


@pytest.mark.django_db
def test_search_query_protein_is_last_in_all_proteins(api_client):
    """Query proteins must be last so Cytoscape renders them on top."""
    p_query = _make_protein_with_identifier('BAD')
    p_interactor = ProteinFactory(gene_name='INTERACTOR')
    InteractionFactory(interactor_A=p_query, interactor_B=p_interactor, removed='0')

    response = api_client.get('/api/search?q=BAD')
    data = response.json()
    protein_ids = [p['protein_id'] for p in data['all_proteins']]
    assert protein_ids[-1] == p_query.id
```

- [ ] **Step 9.2: Run tests — verify they fail**

```bash
pytest interactions/tests/test_views.py -v 2>&1 | head -20
```

- [ ] **Step 9.3: Write interactions/search_service.py**

> **Note:** Use the `tdd` skill when executing this task — implement one behavior at a time (tracer bullet approach), not all tests then all code.

Key design decisions locked in grilling:
- **No server-side score/category filtering** — backend returns all matching interactions unfiltered; the frontend filters client-side
- **Annotation behavior matches legacy** — all annotation types (including tissue_expression, subcellular_location) go into `annotation_array`; `tissue_expression_array` and `subcellular_location_expression_array` return empty `{}`
- **Interaction `annotation_array` is `{type: [list_of_json_strings]}`** — a list per type, not a single string
- **`removed='0'` guard on full queryset before Q split** — fixes legacy SQL operator-precedence bug where removed interactions could surface on B-side matches

```python
# backend/interactions/search_service.py
"""
Search algorithm: mirrors legacy SearchController.getInteractionData() pipeline.
Pure function — no HTTP, no DRF. Returns a plain dict.

Filter modes (filter_parameter):
  'None'            — all proteins connected to any query protein; all interactions among that set
  'query_interactor'— same interactor expansion; only interactions where one side is a query protein
  'query_query'     — only query proteins; only interactions between query proteins
"""
import json
from typing import Optional

from django.db.models import Q

from proteins.models import Protein, Identifier, ProteinIdentifier, Annotation, AnnotationProtein
from .models import (
    Interaction,
    InteractionDataset,
    InteractionInteractionCategory,
)


def _safe_float(value) -> Optional[float]:
    try:
        return float(value) if value else None
    except (ValueError, TypeError):
        return None


def _build_protein_dict(protein: Protein, annotations_by_protein: dict) -> dict:
    # Legacy behavior: all annotation types (including tissue_expression,
    # subcellular_location) go into annotation_array. Separate fields return {}.
    return {
        'protein_id': protein.id,
        'protein_uniprot_id': protein.uniprot_id or '',
        'protein_ensembl_id': protein.ensembl_id or '',
        'protein_entrez_id': protein.entrez_id or '',
        'protein_gene_name': protein.gene_name or '',
        'protein_protein_name': protein.protein_name or '',
        'protein_description': protein.description or '',
        'protein_sequence': protein.sequence or '',
        'number_of_interactions_in_database': protein.number_of_interactions_in_database or 0,
        'annotation_array': annotations_by_protein.get(protein.id, {}),
        'tissue_expression_array': {},
        'subcellular_location_expression_array': {},
    }


def _build_interaction_dict(
    ix: Interaction,
    a_protein: Protein,
    b_protein: Protein,
    datasets_by_interaction: dict,
    categories_by_interaction: dict,
    annotations_by_interaction: dict,
) -> dict:
    # Dataset array
    dataset_array = []
    for ds in datasets_by_interaction.get(ix.id, []):
        dataset_array.append({
            'dataset_reference': ds.pubmed_id or '',
            'dataset_author': ds.author if ds.author else 'Unpublished Dataset',
            'year': ds.year or '',
            'description': ds.description or '',
            'interaction_status': ds.interaction_status or '',
            'name': ds.name or '',
        })

    # Category array + highest order
    cat_entries = []
    highest_order = 0
    highest_status = ''
    for cat in categories_by_interaction.get(ix.id, []):
        order_val = int(cat.order) if cat.order and str(cat.order).isdigit() else 0
        cat_entries.append({'category_name': cat.category_name or '', 'order': order_val})
        if order_val > highest_order:
            highest_order = order_val
            highest_status = cat.category_name or ''

    # Interaction annotation_array: {type_name: [json_string, ...]} — list per type
    annotation_array = {}
    experiment_array = []
    for ann in annotations_by_interaction.get(ix.id, []):
        if ann.type_name == 'experiment':
            experiment_array.append(ann.annotation or '')
        elif ann.type_name:
            annotation_array.setdefault(ann.type_name, [])
            if ann.annotation not in annotation_array[ann.type_name]:
                annotation_array[ann.type_name].append(ann.annotation or '')

    def _nested(p: Protein) -> dict:
        return {
            'protein_id': p.id,
            'protein_uniprot_id': p.uniprot_id or '',
            'protein_gene_name': p.gene_name or '',
            'protein_ensembl_id': p.ensembl_id or '',
        }

    return {
        'interaction_id': ix.id,
        'interactor_A': _nested(a_protein),
        'interactor_B': _nested(b_protein),
        'score': _safe_float(ix.score),
        'annotation_array': annotation_array,
        'experiment_array': experiment_array,
        'dataset_array': dataset_array,
        'interaction_category_array': {
            'highest_category_status': highest_status,
            'highest_order': highest_order,
            'interaction_category_array': cat_entries,
        },
    }


def execute_search(q: str, filter_parameter: str = 'None') -> dict:
    """
    Returns unfiltered search results. Score and category filtering happen
    client-side in the frontend (filterInteractions.ts). Only filter_parameter
    changes the SQL query shape.
    """
    terms = [t.strip() for t in q.split(',') if t.strip()]

    # ── Step 1: Resolve query proteins via identifier table ──────────────────
    q_filter = Q()
    for term in terms:
        q_filter |= Q(identifier__iexact=term)

    matched_identifiers = Identifier.objects.filter(q_filter)
    query_protein_ids = list(
        ProteinIdentifier.objects.filter(identifier__in=matched_identifiers)
        .values_list('protein_id', flat=True)
        .distinct()
    )
    query_protein_id_set = set(query_protein_ids)

    # Track found / unfound input terms
    found_gene_names = set(
        Protein.objects.filter(id__in=query_protein_ids)
        .values_list('gene_name', flat=True)
    )
    found_upper = {g.upper() for g in found_gene_names if g}
    found_terms = [t for t in terms if t.upper() in found_upper]
    unfound_terms = [t for t in terms if t.upper() not in found_upper]

    if not query_protein_ids:
        return {
            'all_proteins': [], 'all_interactions': [],
            'domains': '', 'complexes': '',
            'query_protein_id_array': [],
            'search_term': q,
            'found_protein_summary': '',
            'unfound_protein_summary': '<br>'.join(unfound_terms),
        }

    # ── Step 2: Find interactor ID set ───────────────────────────────────────
    if filter_parameter in ('None', 'query_interactor'):
        # Fix of legacy bug: apply removed='0' before the OR split so both
        # interactor_A and interactor_B sides are guarded.
        connected = (
            Interaction.objects.filter(removed='0')
            .filter(
                Q(interactor_A_id__in=query_protein_ids) |
                Q(interactor_B_id__in=query_protein_ids)
            )
            .values_list('interactor_A_id', 'interactor_B_id')
        )
        interactor_id_set = set()
        for a_id, b_id in connected:
            interactor_id_set.add(a_id)
            interactor_id_set.add(b_id)
        interactor_ids = list(interactor_id_set)
    else:  # query_query
        interactor_ids = query_protein_ids

    # ── Step 3: Find final interactions ──────────────────────────────────────
    base_qs = Interaction.objects.filter(removed='0')
    if filter_parameter == 'None':
        interactions_qs = base_qs.filter(
            interactor_A_id__in=interactor_ids,
            interactor_B_id__in=interactor_ids,
        )
    elif filter_parameter == 'query_interactor':
        interactions_qs = base_qs.filter(
            Q(interactor_A_id__in=query_protein_ids, interactor_B_id__in=interactor_ids) |
            Q(interactor_A_id__in=interactor_ids, interactor_B_id__in=query_protein_ids)
        )
    else:  # query_query
        interactions_qs = base_qs.filter(
            interactor_A_id__in=query_protein_ids,
            interactor_B_id__in=query_protein_ids,
        )

    interactions_list = list(interactions_qs)
    interaction_ids = [ix.id for ix in interactions_list]

    # ── Step 4: Build protein nodes ───────────────────────────────────────────
    protein_map = {p.id: p for p in Protein.objects.filter(id__in=interactor_ids)}

    # All annotation types go into annotation_array (matches legacy behavior)
    ann_protein_links = AnnotationProtein.objects.filter(
        protein_id__in=interactor_ids
    ).select_related('annotation')

    annotations_by_protein = {}
    for ap in ann_protein_links:
        ann = ap.annotation
        pid = ap.protein_id
        if ann.type_name:
            annotations_by_protein.setdefault(pid, {})[ann.type_name] = ann.annotation or ''

    non_query_proteins = []
    query_proteins = []
    for pid, p in protein_map.items():
        obj = _build_protein_dict(p, annotations_by_protein)
        if pid in query_protein_id_set:
            query_proteins.append(obj)
        else:
            non_query_proteins.append(obj)

    # Query proteins go LAST — they render on top in Cytoscape
    all_proteins = non_query_proteins + query_proteins

    # ── Steps 5-6: Batch fetch datasets + categories ──────────────────────────
    datasets_by_interaction = {}
    for id_obj in InteractionDataset.objects.filter(
        interaction_id__in=interaction_ids
    ).select_related('dataset'):
        datasets_by_interaction.setdefault(id_obj.interaction_id, []).append(id_obj.dataset)

    categories_by_interaction = {}
    for ic in InteractionInteractionCategory.objects.filter(
        interaction_id__in=interaction_ids
    ).select_related('interaction_category'):
        categories_by_interaction.setdefault(ic.interaction_id, []).append(ic.interaction_category)

    # ── Step 7: Interaction annotations (queried via annotation.identifier) ───
    annotations_by_interaction = {}
    for ann in Annotation.objects.filter(identifier__in=interaction_ids):
        annotations_by_interaction.setdefault(ann.identifier, []).append(ann)

    # ── Step 8: Classify edges + build output ─────────────────────────────────
    multi_query_edges, query_edges, interactor_edges = [], [], []

    for ix in interactions_list:
        a_protein = protein_map.get(ix.interactor_A_id)
        b_protein = protein_map.get(ix.interactor_B_id)
        if a_protein is None or b_protein is None:
            continue

        a_is_query = ix.interactor_A_id in query_protein_id_set
        b_is_query = ix.interactor_B_id in query_protein_id_set

        if a_is_query and b_is_query:
            edge_type, a_side, b_side = 'multi', a_protein, b_protein
        elif a_is_query:
            edge_type, a_side, b_side = 'query', a_protein, b_protein
        elif b_is_query:
            edge_type, a_side, b_side = 'query', b_protein, a_protein  # swap: query → A
        else:
            edge_type, a_side, b_side = 'interactor', a_protein, b_protein

        edge = _build_interaction_dict(
            ix, a_side, b_side,
            datasets_by_interaction, categories_by_interaction, annotations_by_interaction,
        )

        if edge_type == 'multi':
            multi_query_edges.append(edge)
        elif edge_type == 'query':
            query_edges.append(edge)
        else:
            interactor_edges.append(edge)

    return {
        'all_proteins': all_proteins,
        'all_interactions': multi_query_edges + query_edges + interactor_edges,
        'domains': '',
        'complexes': '',
        'query_protein_id_array': query_protein_ids,
        'search_term': q,
        'found_protein_summary': '<br>'.join(found_terms),
        'unfound_protein_summary': '<br>'.join(unfound_terms),
    }
```

- [ ] **Step 9.4: Write interactions/views.py**

```python
# backend/interactions/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .search_service import execute_search


class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get('q', '')
        # filter_parameter is the only param that shapes the SQL query.
        # score/category filtering is handled client-side by the frontend.
        filter_parameter = request.query_params.get('filter', 'None')
        result = execute_search(q=q, filter_parameter=filter_parameter)
        return Response(result)


class SearchInteractorsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        search_term = request.data.get('searchTerm', '')
        filter_parameter = request.data.get('filterParameter', 'None')
        # Legacy behavior: when query_interactor is passed here, override to query_query
        if filter_parameter == 'query_interactor':
            filter_parameter = 'query_query'
        result = execute_search(q=search_term, filter_parameter=filter_parameter)
        return Response(result)
```

- [ ] **Step 9.5: Write interactions/urls.py**

```python
# backend/interactions/urls.py
from django.urls import path
from .views import SearchView, SearchInteractorsView

urlpatterns = [
    path('search', SearchView.as_view()),
    path('search/interactors', SearchInteractorsView.as_view()),
]
```

- [ ] **Step 9.6: Update root URL conf**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
    path('api/', include('core.urls')),
    path('api/', include('proteins.urls')),
    path('api/', include('datasets.urls')),
    path('api/', include('interactions.urls')),
]
```

- [ ] **Step 9.7: Run tests — verify they pass**

```bash
pytest interactions/tests/test_views.py -v
```

Expected: all 7 tests pass.

If `test_search_query_protein_is_last_in_all_proteins` fails — review the `query_proteins` / `non_query_proteins` split in `execute_search`.

- [ ] **Step 9.8: Run all tests to check for regressions**

```bash
pytest -v
```

All tests in all apps should pass.

- [ ] **Step 9.9: Run linters and commit**

```bash
ruff check . && black --check .
git add backend/interactions/
git commit -m "feat: implement search endpoint with 8-step algorithm (filter modes, edge ordering, annotation enrichment)"
```

- [ ] **Step 9.10: Run parity test**

Invoke the `parity-test` skill to compare `/api/search?q=BAD,BCL2L1` against the live legacy at `openpip.usask.ca`. Same proteins, same interactions, same scores, same category statuses.

---

## Task 10: Upload Endpoint (PSI-MI TAB parser)

**Files:**
- Modify: `backend/datasets/views.py` (add `UploadView`)
- Create: `backend/datasets/upload_parser.py`
- Create: `backend/datasets/tests/test_upload.py`

- [ ] **Step 10.1: Write failing test**

```python
# backend/datasets/tests/test_upload.py
import io
import pytest
from proteins.models import Protein, Identifier, ProteinIdentifier
from interactions.models import Interaction
from datasets.models import Dataset


PSI_MI_CONTENT = b"""#id_A\tid_B
uniprotkb:Q92934\tuniprotkb:Q07817
uniprotkb:Q07817\tuniprotkb:Q16611
"""


@pytest.mark.django_db
def test_upload_requires_admin(user_auth_client):
    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = 'test.tab'
    response = user_auth_client.post('/api/upload/', {'file': f}, format='multipart')
    assert response.status_code == 403


@pytest.mark.django_db
def test_upload_psi_mi_creates_interactions(auth_client):
    Protein.objects.create(id=100, gene_name='BAD', uniprot_id='Q92934')
    i1 = Identifier.objects.create(identifier='Q92934', naming_convention='uniprotkb')
    p1 = Protein.objects.get(uniprot_id='Q92934')
    ProteinIdentifier.objects.create(protein=p1, identifier=i1)

    f = io.BytesIO(PSI_MI_CONTENT)
    f.name = 'test.tab'
    response = auth_client.post('/api/upload/', {'file': f}, format='multipart')
    assert response.status_code == 200
    assert Interaction.objects.count() >= 1
    # Protein Q07817 was not in DB — should have been created
    assert Protein.objects.filter(uniprot_id='Q07817').exists()


@pytest.mark.django_db
def test_upload_skips_duplicate_interactions(auth_client):
    p1 = Protein.objects.create(gene_name='A', uniprot_id='P00001')
    p2 = Protein.objects.create(gene_name='B', uniprot_id='P00002')
    Identifier.objects.create(identifier='P00001', naming_convention='uniprotkb')
    Identifier.objects.create(identifier='P00002', naming_convention='uniprotkb')
    i1 = Identifier.objects.get(identifier='P00001')
    i2 = Identifier.objects.get(identifier='P00002')
    ProteinIdentifier.objects.create(protein=p1, identifier=i1)
    ProteinIdentifier.objects.create(protein=p2, identifier=i2)
    Interaction.objects.create(interactor_A=p1, interactor_B=p2, removed='0')

    content = b"#h\nP00001\tP00002\n"
    f = io.BytesIO(content)
    f.name = 'test.tab'
    auth_client.post('/api/upload/', {'file': f}, format='multipart')
    assert Interaction.objects.filter(interactor_A=p1, interactor_B=p2).count() == 1
```

- [ ] **Step 10.2: Run tests — verify they fail**

```bash
pytest datasets/tests/test_upload.py -v 2>&1 | head -20
```

- [ ] **Step 10.3: Write datasets/upload_parser.py**

```python
# backend/datasets/upload_parser.py
"""PSI-MI TAB parser — mirrors legacy DataController::insertAction behavior."""
import csv
import io
from typing import Optional

from proteins.models import Protein, Identifier, ProteinIdentifier
from interactions.models import Interaction


def _get_naming_convention(identifier: str) -> str:
    """Infer naming convention from identifier prefix."""
    lower = identifier.lower()
    if lower.startswith('uniprotkb:') or lower.startswith('uniprot:'):
        return 'uniprotkb'
    if lower.startswith('ensembl:'):
        return 'ensembl'
    if lower.startswith('entrez gene:') or lower.startswith('entrez:'):
        return 'entrez'
    return 'gene_name'


def _strip_prefix(identifier: str) -> str:
    """Strip database prefix (e.g. 'uniprotkb:Q92934' → 'Q92934')."""
    if ':' in identifier:
        return identifier.split(':', 1)[1].strip()
    return identifier.strip()


def _protein_handler(raw_id: str) -> Protein:
    """
    Resolve or create a Protein from a raw PSI-MI identifier string.
    Mirrors legacy protein_handler(): lookup via Identifier, create if not found.
    """
    clean_id = _strip_prefix(raw_id)
    naming_convention = _get_naming_convention(raw_id)

    identifier_obj = Identifier.objects.filter(identifier__iexact=clean_id).first()
    if identifier_obj:
        link = ProteinIdentifier.objects.filter(identifier=identifier_obj).first()
        if link:
            return link.protein

    # Create new Protein + Identifier
    protein = Protein.objects.create(
        uniprot_id=clean_id if naming_convention == 'uniprotkb' else None,
        gene_name=clean_id if naming_convention == 'gene_name' else None,
    )
    identifier_obj = Identifier.objects.create(
        identifier=clean_id,
        naming_convention=naming_convention,
    )
    ProteinIdentifier.objects.create(protein=protein, identifier=identifier_obj)
    return protein


def _is_new_interaction(protein_a: Protein, protein_b: Protein) -> bool:
    return not Interaction.objects.filter(
        interactor_A__in=[protein_a, protein_b],
        interactor_B__in=[protein_a, protein_b],
    ).filter(
        interactor_A_id__in=[protein_a.id, protein_b.id],
        interactor_B_id__in=[protein_a.id, protein_b.id],
    ).exists()


def parse_and_ingest(file_bytes: bytes) -> dict:
    """
    Parse PSI-MI TAB file bytes and ingest interactions.
    Returns {'created': int, 'skipped': int, 'errors': list}.
    """
    created = 0
    skipped = 0
    errors = []

    text = file_bytes.decode('utf-8', errors='replace')
    reader = csv.reader(io.StringIO(text), delimiter='\t')

    for row_num, row in enumerate(reader):
        if row_num == 0 or not row:  # skip header row 0 and empty rows
            continue
        if len(row) < 2:
            continue

        raw_a = row[0].strip()
        raw_b = row[1].strip()
        if not raw_a or not raw_b:
            continue

        try:
            protein_a = _protein_handler(raw_a)
            protein_b = protein_a if raw_a == raw_b else _protein_handler(raw_b)

            if _is_new_interaction(protein_a, protein_b):
                Interaction.objects.create(
                    interactor_A=protein_a,
                    interactor_B=protein_b,
                    removed='0',
                )
                created += 1
            else:
                skipped += 1
        except Exception as exc:
            errors.append(f'Row {row_num}: {exc}')

    return {'created': created, 'skipped': skipped, 'errors': errors}
```

- [ ] **Step 10.4: Add UploadView to datasets/views.py**

Add to the bottom of `backend/datasets/views.py`:

```python
from .upload_parser import parse_and_ingest


class UploadView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            from rest_framework import status as drf_status
            return Response({'detail': 'No file provided.'}, status=drf_status.HTTP_400_BAD_REQUEST)
        file_bytes = uploaded_file.read()
        result = parse_and_ingest(file_bytes)
        return Response(result)
```

Also add `UploadView` to `datasets/urls.py`:

```python
# backend/datasets/urls.py  (updated)
from django.urls import path
from .views import DatasetListView, DatasetFileDownloadView, DatasetArchiveDownloadView, UploadView

urlpatterns = [
    path('datasets', DatasetListView.as_view()),
    path('datasets/download/', DatasetArchiveDownloadView.as_view()),
    path('datasets/<str:dataset_reference>/download', DatasetFileDownloadView.as_view()),
    path('upload/', UploadView.as_view()),
]
```

- [ ] **Step 10.5: Run tests — verify they pass**

```bash
pytest datasets/tests/test_upload.py -v
```

Expected: all 3 tests pass.

- [ ] **Step 10.6: Run all tests**

```bash
pytest -v
```

All tests across all apps should pass.

- [ ] **Step 10.7: Run linters and commit**

```bash
ruff check . && black --check .
git add backend/datasets/
git commit -m "feat: add PSI-MI TAB upload endpoint with protein handler and dedup logic"
```

---

## Task 11: Root URL Configuration + CORS Smoke Test

- [ ] **Step 11.1: Final root URL conf**

```python
# backend/openpip/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/', include('admin_panel.urls')),
    path('api/', include('core.urls')),
    path('api/', include('proteins.urls')),
    path('api/', include('datasets.urls')),
    path('api/', include('interactions.urls')),
]
```

- [ ] **Step 11.2: Verify all routes exist**

```bash
python manage.py show_urls 2>/dev/null || python manage.py shell -c "
from django.urls import reverse
for name, url in [
    ('GET /api/settings', '/api/settings'),
    ('GET /api/announcements', '/api/announcements'),
    ('GET /api/counts', '/api/counts'),
    ('POST /api/auth/login', '/api/auth/login'),
    ('GET /api/auth/me', '/api/auth/me'),
    ('GET /api/search', '/api/search'),
    ('GET /api/proteins/autocomplete', '/api/proteins/autocomplete'),
    ('GET /api/datasets', '/api/datasets'),
    ('POST /api/upload/', '/api/upload/'),
]:
    print(f'  {name} — {url}')
"
```

If `show_urls` fails with "No module named", that's fine — the shell check is sufficient.

- [ ] **Step 11.3: Run dev server + manual smoke test**

Port 8001 — port 8000 is live production.

```bash
python manage.py runserver 8001 &
curl -s http://localhost:8001/api/settings | python -m json.tool | head -10
curl -s http://localhost:8001/api/counts
```

Expected:
```json
{"title": "openPIP — Protein Interaction Portal", ...}
{"proteins": 0, "interactions": 0}
```

(counts are 0 until migration script runs — that's correct)

- [ ] **Step 11.4: Stop dev server and run full test suite**

```bash
kill %1  # stop background server
pytest -v --tb=short
```

All tests must pass. Fix any failures before continuing.

- [ ] **Step 11.5: Run linters — final check**

```bash
ruff check . && black --check .
```

- [ ] **Step 11.6: Commit**

```bash
git add backend/
git commit -m "feat: finalize root URL conf and verify all API routes"
```

---

## Task 12: Dockerfile + docker-compose.yml

**Files:**
- Create: `backend/Dockerfile`
- Create: `docker-compose.yml` (project root `~/openpip-2.0/`)
- Create: `.env.example` (project root)

- [ ] **Step 12.1: Write backend/Dockerfile**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

For production, replace CMD with gunicorn:
```
CMD ["gunicorn", "openpip.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

- [ ] **Step 12.2: Write docker-compose.yml at project root**

```yaml
# ~/openpip-2.0/docker-compose.yml
version: '3.9'

services:
  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: openpip
      POSTGRES_USER: openpip
      POSTGRES_PASSWORD: ${DB_PASSWORD:-openpip_dev}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U openpip"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      DJANGO_SETTINGS_MODULE: openpip.settings.dev
      DATABASE_URL: postgres://openpip:${DB_PASSWORD:-openpip_dev}@db:5432/openpip
      SECRET_KEY: ${SECRET_KEY:-django-insecure-dev-key-change-me}
      ALLOWED_HOSTS: localhost,127.0.0.1,backend
      CORS_ALLOWED_ORIGINS: http://localhost:5173,http://frontend:5173
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8001:8000"   # host 8001 — port 8000 is live production PHP
    volumes:
      - ./backend:/app
    command: >
      sh -c "python manage.py migrate &&
             python manage.py loaddata admin_panel/fixtures/initial_data.json 2>/dev/null || true &&
             python manage.py runserver 0.0.0.0:8000"

  # NOTE: seed fixture is a fallback only. After running migration/migrate_legacy.py
  # the loaddata above will fail silently (duplicate PK) — that is expected and correct.

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "5173:5173"
    environment:
      VITE_API_BASE_URL: http://localhost:8001/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

- [ ] **Step 12.3: Write .env.example at project root**

```
# ~/openpip-2.0/.env.example
# Copy to .env and set values
DB_PASSWORD=openpip_dev
SECRET_KEY=django-insecure-dev-key-change-in-production
```

Copy if .env doesn't exist:
```bash
cd ~/openpip-2.0
cp .env.example .env
```

- [ ] **Step 12.4: Verify docker compose builds**

Run from `~/openpip-2.0/` only — never from `~/openPIP/`:
```bash
cd ~/openpip-2.0
docker compose build backend
```

Expected: build completes without errors.

- [ ] **Step 12.5: Start stack and verify migrations apply**

```bash
cd ~/openpip-2.0
docker compose up -d db
docker compose up -d backend
docker compose logs backend --tail 30
```

Expected: logs show `Applying ... OK` for all migrations, then `Starting development server at http://0.0.0.0:8000/`.

- [ ] **Step 12.6: Smoke test against Docker**

```bash
curl -s http://localhost:8001/api/counts
```

Expected: `{"proteins":0,"interactions":0}`

```bash
curl -s http://localhost:8001/api/settings | python -m json.tool | grep title
```

Expected: `"title": "openPIP — Protein Interaction Portal"`

- [ ] **Step 12.7: Stop stack (preserve containers)**

```bash
cd ~/openpip-2.0
docker compose stop
```

- [ ] **Step 12.8: Commit**

```bash
git add backend/Dockerfile docker-compose.yml .env.example
git commit -m "feat: add Dockerfile and docker-compose.yml for full-stack local dev"
```

---

## Task 13: Data Migration Script

One-time script that reads the legacy `mysql8` container via `docker exec` and bulk-loads all tables into the 2.0 Postgres DB. Run after `docker compose up -d db` and `python manage.py migrate`.

**Files:**
- Create: `migration/requirements.txt`
- Create: `migration/migrate_legacy.py`

- [ ] **Step 13.1: Write migration/requirements.txt**

```
pymysql==1.1.1
psycopg2-binary==2.9.9
python-dotenv==1.0.1
```

Install separately from backend deps:
```bash
pip install -r migration/requirements.txt
```

- [ ] **Step 13.2: Write migration/migrate_legacy.py**

```python
#!/usr/bin/env python3
"""
One-time migration: legacy MySQL (mysql8 Docker container) → 2.0 Postgres.

Usage:
    python migration/migrate_legacy.py [--reset]

    --reset   Truncate all target tables before inserting (for re-runs during dev).
              Default: fail loudly on duplicate PKs.

Prerequisites:
    - docker compose up -d db  (2.0 Postgres running, port 5432 exposed to host)
    - python manage.py migrate  (Django tables created)
    - pip install -r migration/requirements.txt
    - POSTGRES_URL env var or DATABASE_URL in ~/openpip-2.0/.env
"""
import subprocess
import io
import sys
import os
import argparse

import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

MYSQL_CONTAINER = 'mysql8'
MYSQL_USER = 'root'
MYSQL_PASS = 'secret'
MYSQL_DB = 'huri'

# Tables in dependency order (parents before children)
# Skip: user (FOSUserBundle format), fos_group, fos_user_user_group, test_table
TABLES = [
    'admin_settings',
    'announcement',
    'annotation_type',
    'organism',
    'protein',
    'identifier',
    'protein_identifier',
    'protein_organism',
    'protein_isoform',
    'interaction_category',
    'interaction',
    'dataset',
    'interaction_dataset',
    'interaction_interaction_category',
    'domain',
    'domain_organism',
    'interaction_domain',
    'complex',
    'complex_protein',
    'annotation',
    'annotation_protein',
    'annotation_interaction',
    'interaction_network',
    'interaction_interaction_networks',
    'support_information',
    'interaction_support_information',
    'data_file',
    'dataset_request',
    'dataset_request_dataset',
    'external_link',
]


def mysql_tsv(table: str) -> str:
    """Stream table from MySQL container as TSV (with header row)."""
    result = subprocess.run(
        [
            'docker', 'exec', MYSQL_CONTAINER,
            'mysql', f'-u{MYSQL_USER}', f'-p{MYSQL_PASS}', MYSQL_DB,
            '--batch', '--silent', '-e', f'SELECT * FROM `{table}`',
        ],
        capture_output=True, text=True, timeout=300,
    )
    if result.returncode != 0:
        raise RuntimeError(f'MySQL error on {table}: {result.stderr}')
    return result.stdout


def get_columns(table: str) -> list[str]:
    """Return column names for the table."""
    result = subprocess.run(
        [
            'docker', 'exec', MYSQL_CONTAINER,
            'mysql', f'-u{MYSQL_USER}', f'-p{MYSQL_PASS}', MYSQL_DB,
            '--batch', '--silent', '-e',
            f"SELECT COLUMN_NAME FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA='{MYSQL_DB}' AND TABLE_NAME='{table}' "
            f"ORDER BY ORDINAL_POSITION",
        ],
        capture_output=True, text=True,
    )
    return [c.strip() for c in result.stdout.strip().splitlines() if c.strip()]


def migrate_table(conn, table: str, reset: bool) -> int:
    columns = get_columns(table)
    if not columns:
        print(f'  {table}: no columns found, skipping')
        return 0

    tsv_data = mysql_tsv(table)
    lines = tsv_data.strip().splitlines()
    if len(lines) <= 1:
        print(f'  {table}: empty')
        return 0

    data_lines = lines[1:]  # skip header
    row_count = len(data_lines)

    with conn.cursor() as cur:
        if reset:
            cur.execute(f'TRUNCATE TABLE "{table}" RESTART IDENTITY CASCADE')

        # Disable triggers during bulk load
        cur.execute('SET session_replication_role = replica')

        buf = io.StringIO('\n'.join(data_lines))
        cur.copy_from(buf, table, columns=columns, null='\\N', sep='\t')

        cur.execute('SET session_replication_role = DEFAULT')

        # Reset sequence to max(id) + 1 to avoid PK collisions on new inserts
        if 'id' in columns:
            cur.execute(
                f"SELECT setval(pg_get_serial_sequence('{table}', 'id'), "
                f"COALESCE(MAX(id), 1)) FROM \"{table}\""
            )

    conn.commit()
    return row_count


def main():
    parser = argparse.ArgumentParser(description='Migrate legacy MySQL data to Postgres')
    parser.add_argument('--reset', action='store_true',
                        help='Truncate tables before inserting (for dev re-runs)')
    args = parser.parse_args()

    db_url = os.environ.get('DATABASE_URL', 'postgres://openpip:openpip@localhost:5432/openpip')
    conn = psycopg2.connect(db_url)

    total_rows = 0
    failed = []

    for table in TABLES:
        try:
            rows = migrate_table(conn, table, reset=args.reset)
            print(f'  ✓ {table}: {rows} rows')
            total_rows += rows
        except Exception as exc:
            print(f'  ✗ {table}: {exc}')
            failed.append(table)
            conn.rollback()

    conn.close()

    print(f'\nDone. {total_rows} total rows migrated.')
    if failed:
        print(f'Failed tables: {failed}')
        sys.exit(1)


if __name__ == '__main__':
    main()
```

- [ ] **Step 13.3: Run the migration**

```bash
cd ~/openpip-2.0
docker compose up -d db
cd backend && python manage.py migrate
cd ..
python migration/migrate_legacy.py
```

Expected: each table prints `✓ <table>: N rows`. Final line: `Done. ~500000+ total rows migrated.`

For a clean re-run during dev:
```bash
python migration/migrate_legacy.py --reset
```

- [ ] **Step 13.4: Verify counts match legacy**

```bash
# 2.0 counts
curl -s http://localhost:8001/api/counts

# Legacy counts (from MySQL directly)
docker exec mysql8 mysql -uroot -psecret huri -e \
  "SELECT COUNT(*) as proteins FROM protein; SELECT COUNT(*) as interactions FROM interaction WHERE removed=0;"
```

Expected: both return `proteins: 11600, interactions: 76563`.

- [ ] **Step 13.5: Run parity test on search**

With real data loaded, invoke the `parity-test` skill to compare `/api/search?q=BAD,BCL2L1` against `openpip.usask.ca`.

- [ ] **Step 13.6: Commit**

```bash
git add migration/
git commit -m "feat: add one-time MySQL→Postgres data migration script"
```

---

## Self-Review Checklist

### Spec Coverage

| Requirement | Covered in Task |
|---|---|
| GET /api/settings (camelCase) | Task 6 |
| PATCH /api/settings (admin-only) | Task 6 |
| GET /api/announcements (camelCase, showOnHomePage) | Task 6 |
| GET /api/counts (removed='0' filter) | Task 6 |
| POST /api/auth/login (+ is_admin in response) | Task 7 |
| POST /api/auth/logout | Task 7 |
| POST /api/auth/register | Task 7 |
| GET /api/auth/me | Task 7 |
| POST /api/contact | Task 7 |
| GET /api/proteins/autocomplete (case-insensitive, min 2 chars) | Task 8 |
| GET /api/datasets (dataset_author fallback) | Task 8 |
| GET /api/datasets/{ref}/download (JWT) | Task 8 |
| GET /api/datasets/download/ (JWT, zip) | Task 8 |
| GET /api/search (8-step algorithm, filter modes) | Task 9 |
| POST /api/search/interactors (query_interactor→query_query override) | Task 9 |
| Search: removed='0' filter | Task 9 |
| Search: score is float in response | Task 9 |
| Search: query proteins last in all_proteins | Task 9 |
| Search: edge ordering (multi→query→interactor) | Task 9 |
| Search: found/unfound summary with `<br>` separator | Task 9 |
| Search: interaction category capitalization (Published/Validated/Verified/Literature) | Task 5 (seed) |
| POST /api/upload/ (admin-only, PSI-MI TAB, dedup) | Task 10 |
| No /api/export/ endpoints | ✓ (not built) |
| No backend enrichment endpoints | ✓ (not built) |
| Models: same table/column names as legacy | Tasks 2–4 |
| AdminSettings singleton id=1 | Task 5 (seed) or Task 13 (migration) |
| mission_title/text, method_title/text (in legacy entity + live DB) | Task 4 |
| Postgres case-sensitivity: ILIKE via iexact/icontains | Task 9 |
| Docker Compose (db + backend + frontend) | Task 12 |
| Settings split base/dev/prod | Task 1 |
| Port 8001 (not 8000 — production PHP) | Tasks 1, 11, 12 |
| Pytest against Postgres | Task 1 |
| No server-side score/category filtering | Task 9 |
| All annotation types in annotation_array (legacy behavior) | Task 9 |
| Fixed removed-filter bug | Task 9 |
| Interaction annotation_array as list-per-type | Task 9 |
| One-time data migration script | Task 13 |
| `tdd` skill during Task 9 | Task 9 |
| `parity-test` skill after Tasks 6, 7, 9, 13 | Tasks 6, 7, 9, 13 |

### Known Gaps

- **Score filtering**: removed from backend entirely — handled client-side. If a direct API caller needs server-side score filtering, add it in Phase 2.
- **Dataset file downloads**: serve files from `dataset.file_path`. In Docker, this path must be mounted as a volume. The Docker compose volume strategy for data files is not defined in the spec — confirm with Dr. Helmy.
- **Email sending (contact form)**: Phase 1 logs to console (`dev.py` uses `console` backend). Wire up SMTP in `prod.py` once email config is known.
- **`UploadFiles` model**: not populated by `UploadView` in Phase 1. The legacy uploader tracked uploads there. This is a minor parity gap — add if parity tests require it.
- **`domain_organism`, `organism_domain` tables**: defined in legacy schema but not used by any API endpoint. Models exist in the migrations but no views/serializers reference them. Add if parity tests reveal gaps.

---

**Plan complete and updated — `docs/superpowers/plans/2026-05-11-backend-migration.md` (13 tasks).**

**Two execution options:**

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
