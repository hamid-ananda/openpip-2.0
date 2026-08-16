import re

from rest_framework import serializers

from .models import Dataset

PUBMED_RE = re.compile(r"^\d{1,8}$")
# Crossref DOIs are all "10.<registrant>/<suffix>"; the suffix is deliberately
# permissive because publishers put almost anything in it.
DOI_RE = re.compile(r"^10\.\d{4,9}/\S+$", re.IGNORECASE)
YEAR_RE = re.compile(r"^\d{4}$")

CITATION_FIELDS = [
    "pubmed_id",
    "author",
    "year",
    "title",
    "journal",
    "doi",
    "url",
    "publication_status",
]

ABOUT_FIELDS = [
    "about_heading",
    "about_body",
    "show_on_about",
    "about_order",
]


class DatasetSerializer(serializers.ModelSerializer):
    """Public read shape.

    `dataset_reference` and `dataset_author` are legacy aliases that the search
    UI, exports and PSICQUIC already read; they stay so nothing downstream has
    to change at once. The plain citation fields are the ones new code uses.
    """

    dataset_reference = serializers.SerializerMethodField()
    dataset_author = serializers.SerializerMethodField()
    interaction_status = serializers.CharField()
    citation = serializers.SerializerMethodField()

    class Meta:
        model = Dataset
        fields = [
            "id",
            "dataset_reference",
            "dataset_author",
            "year",
            "description",
            "interaction_status",
            "name",
            "citation",
            "number_of_interactions",
            *CITATION_FIELDS,
            *ABOUT_FIELDS,
        ]

    def get_dataset_reference(self, obj):
        return obj.pubmed_id or ""

    def get_dataset_author(self, obj):
        return obj.author if obj.author else "Unpublished Dataset"

    def get_citation(self, obj):
        """A single pre-formatted reference string, or None when unciteable.

        Formatting it server-side keeps the About page, the Downloads page and
        the export headers from each inventing their own slightly different
        rendering of the same fields.
        """
        return format_citation(obj)


def format_citation(obj) -> str | None:
    """Render `Author (Year). Title. Journal.` from whatever parts are present."""
    parts: list[str] = []
    if obj.author:
        parts.append(f"{obj.author} ({obj.year})" if obj.year else obj.author)
    elif obj.year:
        parts.append(f"({obj.year})")
    if obj.title:
        parts.append(obj.title.rstrip("."))
    if obj.journal:
        parts.append(obj.journal.rstrip("."))
    if not parts:
        return None
    return ". ".join(parts) + "."


class DatasetWriteSerializer(serializers.ModelSerializer):
    """Admin write shape for citation and About-page copy.

    Deliberately excludes `name`, `file_path` and `number_of_interactions`:
    the first two identify the dataset and the third is recomputed from
    InteractionDataset rows after every import.
    """

    # These columns are legacy `null=True` without `blank=True`, so DRF would
    # reject "" as blank. Clearing a wrong citation is a first-class action, so
    # accept the empty string and store it as NULL (see `validate` below).
    pubmed_id = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    author = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    year = serializers.CharField(
        max_length=10, required=False, allow_blank=True, allow_null=True
    )
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True, allow_null=True
    )
    interaction_status = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    url = serializers.URLField(
        max_length=500, required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Dataset
        fields = [
            "description",
            "interaction_status",
            *CITATION_FIELDS,
            *ABOUT_FIELDS,
        ]

    def validate(self, attrs):
        """Store a cleared field as NULL rather than "", so absence is one value."""
        for field in ("pubmed_id", "author", "year", "title", "journal", "doi", "url"):
            if field in attrs and not (attrs[field] or "").strip():
                attrs[field] = None
        return attrs

    def validate_pubmed_id(self, value):
        # Legacy shipped a row with pubmed_id='HI-III', which made exports emit
        # a literal "pubmed:HI-III". Reject non-numeric PMIDs on the way in.
        if not value:
            return None
        value = value.strip()
        if not PUBMED_RE.match(value):
            raise serializers.ValidationError(
                "A PubMed ID must be digits only, e.g. 25416956."
            )
        return value

    def validate_doi(self, value):
        if not value:
            return None
        value = value.strip()
        # Accept a pasted resolver URL and store the bare DOI.
        for prefix in ("https://doi.org/", "http://doi.org/", "doi:"):
            if value.lower().startswith(prefix):
                value = value[len(prefix) :]
                break
        if not DOI_RE.match(value):
            raise serializers.ValidationError(
                "A DOI must look like 10.1038/s41586-020-2188-x."
            )
        return value

    def validate_year(self, value):
        if not value:
            return None
        value = value.strip()
        if not YEAR_RE.match(value):
            raise serializers.ValidationError("A year must be four digits, e.g. 2014.")
        return value
