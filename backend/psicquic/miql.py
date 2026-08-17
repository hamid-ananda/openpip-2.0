"""
Minimal MIQL (Molecular Interaction Query Language) parser.

Supported syntax:
  BRCA1               plain text — searches gene name or UniProt ID for either interactor
  P38398              plain UniProt ID — same as above
  idA:P38398          interactor A UniProt ID or gene name
  idB:P38398          interactor B UniProt ID or gene name
  id:P38398           either interactor
  taxidA:9606         taxon filter on interactor A
  taxidB:9606         taxon filter on interactor B
  *                   return all interactions

Anything else — other MIQL fields, and the AND / OR / NOT operators — raises
UnsupportedQuery rather than being answered. See the note on SUPPORTED_FIELDS.
"""

import re
from django.db.models import Q, QuerySet
from interactions.models import Interaction


class UnsupportedQuery(ValueError):
    """Raised for valid MIQL this parser cannot answer.

    The alternative is worse than it looks. Before this existed, a query like
    `species:9606` fell through to the plain-text branch, matched no protein
    named "species:9606", and returned zero — a confident, 200-status "there are
    none" to a question about the 122,933 human interactions openPIP holds.
    `detmethod:"two hybrid"` likewise reported none of roughly 80,000.

    A client federating across PSICQUIC services cannot tell that kind of zero
    from a real one, so it records openPIP as having no human data and no
    two-hybrid data. Refusing the query is the difference between "we cannot
    answer that" and "the answer is none".
    """


# Fields this parser implements. Everything else in MIQL is rejected rather
# than guessed at, so the failure is visible to the caller.
SUPPORTED_FIELDS = ("idA", "idB", "id", "taxidA", "taxidB")

# A leading token of the form field:value — the shape of every MIQL field query.
_FIELD_QUERY = re.compile(r"^([A-Za-z_]+):", re.IGNORECASE)

# Boolean operators are part of MIQL but not of this parser.
_OPERATORS = re.compile(r"\b(AND|OR|NOT)\b")


def _proteins_matching(term: str):
    """Return protein PKs matching a gene name or UniProt/Entrez ID."""
    from proteins.models import Protein

    return Protein.objects.filter(
        Q(gene_name__iexact=term)
        | Q(uniprot_id__iexact=term)
        | Q(entrez_id__iexact=term)
    ).values_list("pk", flat=True)


def _proteins_by_taxon(taxon_id: str):
    """Return protein PKs for a given NCBI taxonomy ID."""
    from proteins.models import Protein

    return Protein.objects.filter(
        protein_organisms__organism__taxonomy_id=taxon_id
    ).values_list("pk", flat=True)


def parse_miql(query: str) -> QuerySet:
    """Translate a MIQL query string into an Interaction queryset."""
    base = Interaction.objects.filter(removed="0")
    q = query.strip()

    if not q or q == "*":
        return base

    # idA:term
    m = re.fullmatch(r"idA:(\S+)", q, re.IGNORECASE)
    if m:
        pks = _proteins_matching(m.group(1))
        return base.filter(interactor_A__in=pks)

    # idB:term
    m = re.fullmatch(r"idB:(\S+)", q, re.IGNORECASE)
    if m:
        pks = _proteins_matching(m.group(1))
        return base.filter(interactor_B__in=pks)

    # id:term — either interactor
    m = re.fullmatch(r"id:(\S+)", q, re.IGNORECASE)
    if m:
        pks = _proteins_matching(m.group(1))
        return base.filter(Q(interactor_A__in=pks) | Q(interactor_B__in=pks))

    # taxidA:9606
    m = re.fullmatch(r"taxidA:(\S+)", q, re.IGNORECASE)
    if m:
        pks = _proteins_by_taxon(m.group(1))
        return base.filter(interactor_A__in=pks)

    # taxidB:9606
    m = re.fullmatch(r"taxidB:(\S+)", q, re.IGNORECASE)
    if m:
        pks = _proteins_by_taxon(m.group(1))
        return base.filter(interactor_B__in=pks)

    # Anything still carrying a field prefix or a boolean operator is MIQL we
    # do not implement. Falling through to the plain-text branch would search
    # for the literal string and report zero results.
    if _OPERATORS.search(q):
        raise UnsupportedQuery(
            "Boolean operators (AND, OR, NOT) are not supported. "
            "Query one field at a time."
        )
    field = _FIELD_QUERY.match(q)
    if field:
        raise UnsupportedQuery(
            f"Unsupported query field: {field.group(1)}. "
            f"Supported fields: {', '.join(SUPPORTED_FIELDS)}."
        )

    # Plain text — search gene name or UniProt ID for either interactor
    pks = _proteins_matching(q)
    return base.filter(Q(interactor_A__in=pks) | Q(interactor_B__in=pks))
