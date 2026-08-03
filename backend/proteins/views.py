import json

from django.db.models import Case, F, IntegerField, Q, Value, When
from django.db.models.functions import Coalesce
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import (
    Annotation,
    AnnotationProtein,
    Identifier,
    Protein,
    ProteinIdentifier,
)
from .serializers import ProteinInteractorSerializer, ProteinListSerializer

TRUTHY = {"1", "true", "yes", "on"}


def _is_true(params, key: str) -> bool:
    return params.get(key, "").strip().lower() in TRUTHY


def resolve_protein(identifier: str):
    """
    Look up a protein by any of its identifiers.

    Tries the identifier table first (gene names, UniProt accessions, and every
    other naming convention the importer recorded), then falls back to the
    columns on the protein row itself. Returns None when nothing matches.
    """
    identifier = identifier.strip()
    if not identifier:
        return None

    id_row = Identifier.objects.filter(identifier__iexact=identifier).first()
    if id_row:
        protein = Protein.objects.filter(protein_identifiers__identifier=id_row).first()
        if protein:
            return protein

    return (
        Protein.objects.filter(gene_name__iexact=identifier).first()
        or Protein.objects.filter(uniprot_id__iexact=identifier).first()
        or Protein.objects.filter(ensembl_id__iexact=identifier).first()
        or Protein.objects.filter(entrez_id__iexact=identifier).first()
    )


def _parse_json_annotation(raw: str) -> dict:
    """Tissue and subcellular annotations are stored as JSON blobs in a text column."""
    try:
        return json.loads(raw) if raw else {}
    except (json.JSONDecodeError, TypeError):
        return {}


class ProteinListPagination(LimitOffsetPagination):
    """
    Offset pagination rather than the project-default cursor pagination: the
    browse list needs a total count ("1 of 11,600") and user-chosen ordering,
    neither of which cursor pagination supports.
    """

    default_limit = 100
    max_limit = 500


class ProteinListView(ListAPIView):
    """
    Browsable list of proteins.

    Query params:
      q               — substring match on gene name, protein name, UniProt ID,
                        or any recorded identifier
      ordering        — gene | -gene | interactions | -interactions
      include_empty   — include rows with no gene name (bare UniProt stubs)
      has_interactions— only proteins with at least one interaction
      has_sequence    — only proteins with a stored sequence
      has_structure   — only proteins with a UniProt accession (needed to
                        resolve an AlphaFold model)
    """

    permission_classes = [AllowAny]
    pagination_class = ProteinListPagination
    serializer_class = ProteinListSerializer

    # A null interaction count is reported as 0, so it has to sort as 0 too —
    # Postgres would otherwise order nulls first on DESC and float unscored
    # rows above the most-connected proteins. Rows with no gene name sort last
    # in both directions rather than heading the descending list.
    GENE_ASC = F("gene_name").asc(nulls_last=True)
    GENE_DESC = F("gene_name").desc(nulls_last=True)

    ORDERINGS = {
        "gene": [GENE_ASC, "id"],
        "-gene": [GENE_DESC, "id"],
        "interactions": ["interaction_count", GENE_ASC, "id"],
        "-interactions": ["-interaction_count", GENE_ASC, "id"],
    }

    def get_queryset(self):
        params = self.request.query_params
        qs = Protein.objects.annotate(
            interaction_count=Coalesce("number_of_interactions_in_database", Value(0))
        )

        if not _is_true(params, "include_empty"):
            # ~8.4k rows are bare UniProt stubs with no gene name, no
            # annotations and no interactions. They are noise when browsing,
            # so they are opt-in rather than shown by default.
            qs = qs.exclude(Q(gene_name__isnull=True) | Q(gene_name=""))

        if _is_true(params, "has_interactions"):
            qs = qs.filter(number_of_interactions_in_database__gt=0)
        if _is_true(params, "has_sequence"):
            qs = qs.exclude(Q(sequence__isnull=True) | Q(sequence=""))
        if _is_true(params, "has_structure"):
            qs = qs.exclude(Q(uniprot_id__isnull=True) | Q(uniprot_id=""))

        ordering = self.ORDERINGS.get(
            params.get("ordering", ""), self.ORDERINGS["gene"]
        )

        q = params.get("q", "").strip()
        if q:
            # Match through the identifier table via a subquery rather than a
            # join, so a protein with several matching identifiers still yields
            # exactly one row and pagination offsets stay correct.
            identifier_matches = ProteinIdentifier.objects.filter(
                identifier__identifier__icontains=q
            ).values_list("protein_id", flat=True)
            qs = qs.filter(
                Q(gene_name__icontains=q)
                | Q(protein_name__icontains=q)
                | Q(uniprot_id__icontains=q)
                | Q(id__in=identifier_matches)
            )
            # Exact hits first, then prefix, then the rest — so searching "TP53"
            # does not bury it under TP53BP1 and friends.
            qs = qs.annotate(
                match_rank=Case(
                    When(gene_name__iexact=q, then=0),
                    When(gene_name__istartswith=q, then=1),
                    default=2,
                    output_field=IntegerField(),
                )
            )
            ordering = ["match_rank"] + ordering

        return qs.order_by(*ordering)


class ProteinInteractorsView(APIView):
    """Top interactors of one protein, ranked by how much evidence links the pair."""

    permission_classes = [AllowAny]

    def get(self, request, identifier: str):
        from interactions.models import Interaction

        protein = resolve_protein(identifier)
        if not protein:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            limit = min(int(request.query_params.get("limit", 10)), 100)
        except (TypeError, ValueError):
            limit = 10

        pairs = (
            Interaction.objects.filter(removed="0")
            .filter(Q(interactor_A_id=protein.id) | Q(interactor_B_id=protein.id))
            .values_list("interactor_A_id", "interactor_B_id")
        )

        # One interaction row per piece of evidence, so the same pair can appear
        # more than once — count the repeats as the strength of the link.
        evidence_counts: dict = {}
        for a_id, b_id in pairs:
            other_id = b_id if a_id == protein.id else a_id
            if other_id == protein.id:
                continue  # self-interaction: not a neighbour
            evidence_counts[other_id] = evidence_counts.get(other_id, 0) + 1

        ranked_ids = sorted(
            evidence_counts, key=lambda pid: (-evidence_counts[pid], pid)
        )[:limit]
        by_id = {p.id: p for p in Protein.objects.filter(id__in=ranked_ids)}

        results = [
            {
                "protein_id": p.id,
                "protein_gene_name": p.gene_name or "",
                "protein_protein_name": p.protein_name or "",
                "protein_uniprot_id": p.uniprot_id or "",
                "number_of_interactions_in_database": p.number_of_interactions_in_database
                or 0,
                "shared_interaction_count": evidence_counts[pid],
            }
            for pid in ranked_ids
            if (p := by_id.get(pid)) is not None
        ]

        return Response(
            {
                "count": len(evidence_counts),
                "results": ProteinInteractorSerializer(results, many=True).data,
            }
        )


class AutocompleteView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])
        limit = 20
        # Rank prefix (starts-with) matches ahead of substring matches, each
        # group ordered alphabetically, so the closest match stays on top —
        # e.g. "TP5" surfaces "TP53" before substring hits like "ATP5*".
        prefix = list(
            Identifier.objects.filter(identifier__istartswith=q)
            .order_by("identifier")
            .values_list("identifier", flat=True)
            .distinct()[:limit]
        )
        results = prefix
        if len(results) < limit:
            substring = list(
                Identifier.objects.filter(identifier__icontains=q)
                .exclude(identifier__istartswith=q)
                .order_by("identifier")
                .values_list("identifier", flat=True)
                .distinct()[: limit - len(results)]
            )
            results = results + substring
        return Response(results)


class ProteinDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, identifier: str):
        protein = resolve_protein(identifier)

        if not protein:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Annotations
        annotation_ids = AnnotationProtein.objects.filter(protein=protein).values_list(
            "annotation_id", flat=True
        )
        annotations = Annotation.objects.filter(id__in=annotation_ids)
        annotation_array: dict = {}
        for ann in annotations:
            if ann.type_name:
                annotation_array.setdefault(ann.type_name, [])
                if ann.annotation:
                    annotation_array[ann.type_name].append(ann.annotation)

        # Identifiers list
        identifiers = list(
            Identifier.objects.filter(protein_identifiers__protein=protein).values(
                "identifier", "naming_convention"
            )
        )

        # Tissue and subcellular annotations hold a JSON blob rather than a
        # plain label; parse them out so clients don't each re-implement it.
        # These fields mirror the shape the search endpoint already returns.
        def first_annotation(type_name: str) -> str:
            values = annotation_array.get(type_name) or [""]
            return values[0]

        return Response(
            {
                "protein_id": protein.id,
                "protein_gene_name": protein.gene_name or "",
                "protein_protein_name": protein.protein_name or "",
                "protein_uniprot_id": protein.uniprot_id or "",
                "protein_ensembl_id": protein.ensembl_id or "",
                "protein_entrez_id": protein.entrez_id or "",
                "protein_description": protein.description or "",
                "protein_sequence": protein.sequence or "",
                "number_of_interactions_in_database": protein.number_of_interactions_in_database
                or 0,
                "annotation_array": annotation_array,
                "tissue_expression_array": _parse_json_annotation(
                    first_annotation("tissue_expression")
                ),
                "subcellular_location_expression_array": _parse_json_annotation(
                    first_annotation("subcellular_location")
                ),
                "identifiers": identifiers,
            }
        )
