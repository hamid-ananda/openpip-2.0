from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Annotation, AnnotationProtein, Identifier, Protein


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
        identifier = identifier.strip()

        # Resolve via Identifier table first (handles gene names, UniProt IDs, etc.)
        id_row = (
            Identifier.objects.filter(identifier__iexact=identifier)
            .select_related()
            .first()
        )
        if id_row:
            protein = Protein.objects.filter(
                protein_identifiers__identifier=id_row
            ).first()
        else:
            # Fall back to direct field lookup
            protein = (
                Protein.objects.filter(gene_name__iexact=identifier).first()
                or Protein.objects.filter(uniprot_id__iexact=identifier).first()
                or Protein.objects.filter(ensembl_id__iexact=identifier).first()
                or Protein.objects.filter(entrez_id__iexact=identifier).first()
            )

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
                "identifiers": identifiers,
            }
        )
