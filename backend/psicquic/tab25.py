"""
PSI-MI TAB 2.5 formatter.

Spec: https://psicquic.github.io/MITAB25Format.html
Columns (tab-separated, 15 total):
  0  Unique ID interactor A       uniprotkb:P38398
  1  Unique ID interactor B       uniprotkb:P51587
  2  Alt IDs interactor A         entrez:672|...
  3  Alt IDs interactor B         entrez:675|...
  4  Aliases interactor A         psi-mi:BRCA1(gene name)
  5  Aliases interactor B         psi-mi:BRCA2(gene name)
  6  Interaction detection method psi-mi:"MI:0018"(two hybrid) or -
  7  Publication first author     Foo et al.(2020) or -
  8  Publication ID               pubmed:12345678 or -
  9  Taxon interactor A           taxid:9606(Homo sapiens) or -
 10  Taxon interactor B           taxid:9606(Homo sapiens) or -
 11  Interaction type             psi-mi:"MI:0407"(direct interaction) or -
 12  Source database              openPIP:openPIP
 13  Interaction ID               openPIP:{id}
 14  Confidence score             openPIP:{score} or -

TODO(phase5): TAB 2.6 adds biological roles, experimental roles, interactor types
TODO(phase5): TAB 2.7 adds xrefs, host organism, checksums, negative flag
TODO(phase5): TAB 2.8 adds features (domains/binding sites), stoichiometry, identification methods
TODO(phase5): Register openPIP in PSI-MI controlled vocabulary to get an official MI ID
TODO(phase5): Register in PSICQUIC registry at EBI (https://www.ebi.ac.uk/Tools/webservices/psicquic/registry)
TODO(phase5): Rate limiting on /psicquic/ endpoints and the public API generally
TODO(shelved): PyPI publishing of openpip package — parked with the CLI,
    see cli/src/openpip/sdk.py
"""

import json

from interactions.models import Interaction

# PSI-MI CV labels for the detection-method codes openPIP actually stores, which
# arrive bare ("0018") in litbm_interaction annotations. Only codes listed here
# get a label; anything else is emitted as psi-mi:"MI:xxxx" with no parenthetical.
# That is still spec-valid and consumers resolve labels from the ontology anyway
# — an invented label would be worse than none.
#
# The frontend keeps its own copy in EdgeInfoPanel.tsx for display. Two small
# maps beat an endpoint serving fifteen constants; if a third consumer appears,
# serve it from here.
DETECTION_METHOD_LABELS = {
    "0004": "affinity chromatography technology",
    "0006": "anti bait coimmunoprecipitation",
    "0007": "anti tag coimmunoprecipitation",
    "0018": "two hybrid",
    "0019": "coimmunoprecipitation",
    "0030": "cross-linking study",
    "0059": "gst pull down",
    "0065": "isothermal titration calorimetry",
    "0096": "pull down",
    "0107": "surface plasmon resonance",
    "0114": "x-ray crystallography",
    "0397": "two hybrid array",
    "0415": "enzymatic study",
    "0676": "tandem affinity purification",
}

# Lit-BM records whether the evidence is binary. MI:0407 is the direct-interaction
# term; non-binary evidence supports association but not direct contact, so it
# maps to the weaker MI:0915.
INTERACTION_TYPE_BY_BINARY = {
    "binary": ("0407", "direct interaction"),
    "non_binary": ("0915", "physical association"),
}

# A yeast two-hybrid screen is a direct binary assay by construction.
Y2H_METHOD = ("0018", "two hybrid")
Y2H_TYPE = ("0407", "direct interaction")

TAB25_HEADER = (
    "#ID(s) interactor A\tID(s) interactor B\t"
    "Alt. ID(s) interactor A\tAlt. ID(s) interactor B\t"
    "Alias(es) interactor A\tAlias(es) interactor B\t"
    "Interaction detection method(s)\t"
    "Publication 1st author(s)\tPublication Identifier(s)\t"
    "Taxon interactor A\tTaxon interactor B\t"
    "Interaction type(s)\tSource database(s)\t"
    "Interaction identifier(s)\tConfidence value(s)"
)


def _uniprot(protein) -> str:
    if protein.uniprot_id:
        return f"uniprotkb:{protein.uniprot_id}"
    return f"openPIP:{protein.pk}"


def _alt_ids(protein) -> str:
    parts = []
    if protein.entrez_id:
        parts.append(f"entrez:{protein.entrez_id}")
    if protein.ensembl_id:
        parts.append(f"ensembl:{protein.ensembl_id}")
    # Plain .all() so the queryset's prefetch cache is used; adding
    # .select_related() here would re-query once per protein per row.
    for pi in protein.protein_identifiers.all():
        id_obj = pi.identifier
        if id_obj and id_obj.identifier and id_obj.naming_convention:
            parts.append(f"{id_obj.naming_convention}:{id_obj.identifier}")
    return "|".join(parts) if parts else "-"


def _alias(protein) -> str:
    parts = []
    if protein.gene_name:
        parts.append(f"psi-mi:{protein.gene_name}(gene name)")
    if protein.protein_name:
        parts.append(f"psi-mi:{protein.protein_name}(protein full name)")
    return "|".join(parts) if parts else "-"


def _first(manager):
    """First related row, from the prefetch cache. .first() would re-query."""
    return next(iter(manager.all()), None)


def _taxon(protein) -> str:
    po = _first(protein.protein_organisms)
    if po and po.organism:
        org = po.organism
        return f"taxid:{org.taxonomy_id}({org.name})"
    return "-"


def _publication(interaction) -> tuple[str, str]:
    """Returns (author, publication identifiers) from the first linked dataset.

    Column 8 follows the TAB 2.5 convention of `Surname-Year` (e.g.
    `Rolland-2014`). Column 9 may carry several pipe-separated identifiers, so
    a DOI is appended when the dataset has one — preprints often have only that.
    """
    id_link = _first(interaction.interaction_datasets)
    if not id_link or not id_link.dataset:
        return "-", "-"
    dataset = id_link.dataset

    author = dataset.author or "-"
    if author != "-":
        # "Rolland et al." → "Rolland"; the year is appended separately.
        surname = author.split()[0].rstrip(",")
        author = f"{surname}-{dataset.year}" if dataset.year else surname

    identifiers = []
    if dataset.pubmed_id:
        identifiers.append(f"pubmed:{dataset.pubmed_id}")
    if dataset.doi:
        identifiers.append(f"doi:{dataset.doi}")
    return author, "|".join(identifiers) or "-"


def _psi_mi(code: str, label: str | None) -> str:
    """A PSI-MI CV reference: psi-mi:"MI:0018"(two hybrid)."""
    term = f'psi-mi:"MI:{code}"'
    return f"{term}({label})" if label else term


def _litbm_payloads(interaction) -> list[dict]:
    """Parsed litbm_interaction annotations, skipping anything unparseable.

    The legacy dump stores these as JSON in a varchar, some with a trailing \\r,
    so a bad row is possible and must not take down a whole PSICQUIC response.
    """
    payloads = []
    for link in interaction.annotation_interactions.all():
        annotation = link.annotation
        if not annotation or annotation.type_name != "litbm_interaction":
            continue
        try:
            payload = json.loads((annotation.annotation or "").strip())
        except (ValueError, TypeError):
            continue
        if isinstance(payload, dict):
            payloads.append(payload)
    return payloads


def _is_y2h(interaction) -> bool:
    """True when the interaction came from one of the two-hybrid screens.

    `experiment` annotations carry dna_binding_domain and
    activation_binding_domain, which only a Y2H assay produces.
    """
    return any(
        link.annotation and link.annotation.type_name == "experiment"
        for link in interaction.annotation_interactions.all()
    )


def _detection_methods(interaction) -> str:
    """Column 6. Real MI codes where Lit-BM recorded them, else the Y2H default."""
    codes = {
        str(p["experiment_type"]).strip()
        for p in _litbm_payloads(interaction)
        if p.get("experiment_type")
    }
    if codes:
        return "|".join(
            _psi_mi(code, DETECTION_METHOD_LABELS.get(code)) for code in sorted(codes)
        )
    if _is_y2h(interaction):
        return _psi_mi(*Y2H_METHOD)
    return "-"


def _interaction_types(interaction) -> str:
    """Column 11. From Lit-BM's binary flag, or direct interaction for Y2H.

    openPIP's own categories (Published, Validated, Verified, Literature) are
    curation tiers, not PSI-MI terms, and are deliberately not mapped here.
    """
    terms = {
        INTERACTION_TYPE_BY_BINARY[p["binary_type"]]
        for p in _litbm_payloads(interaction)
        if p.get("binary_type") in INTERACTION_TYPE_BY_BINARY
    }
    if terms:
        return "|".join(_psi_mi(code, label) for code, label in sorted(terms))
    if _is_y2h(interaction):
        return _psi_mi(*Y2H_TYPE)
    return "-"


def format_interaction_tab25(interaction: Interaction) -> str:
    """Serialize one Interaction row as a PSI-MI TAB 2.5 line."""
    a = interaction.interactor_A
    b = interaction.interactor_B
    author, pubmed = _publication(interaction)
    score = f"openPIP:{interaction.score}" if interaction.score else "-"

    cols = [
        _uniprot(a),
        _uniprot(b),
        _alt_ids(a),
        _alt_ids(b),
        _alias(a),
        _alias(b),
        _detection_methods(interaction),
        author,
        pubmed,
        _taxon(a),
        _taxon(b),
        _interaction_types(interaction),
        "openPIP:openPIP",
        f"openPIP:{interaction.pk}",
        score,
    ]
    return "\t".join(cols)


def format_queryset_tab25(queryset) -> str:
    """Serialize a queryset of Interactions as TAB 2.5 text (header + lines)."""
    lines = [TAB25_HEADER]
    for interaction in queryset.select_related(
        "interactor_A", "interactor_B"
    ).prefetch_related(
        "interactor_A__protein_organisms__organism",
        "interactor_B__protein_organisms__organism",
        "interactor_A__protein_identifiers__identifier",
        "interactor_B__protein_identifiers__identifier",
        "interaction_datasets__dataset",
        # Columns 6 and 11 read these; without the prefetch each row costs a query.
        "annotation_interactions__annotation",
    ):
        lines.append(format_interaction_tab25(interaction))
    return "\n".join(lines)
