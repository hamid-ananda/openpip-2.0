"""
PSI-MI TAB formatter — 2.5, 2.6, 2.7 and 2.8.

Specs: https://psicquic.github.io/MITAB25Format.html
       https://psicquic.github.io/MITAB27Format.html
       https://psicquic.github.io/MITAB28Format.html

The versions are strict supersets: 2.5 is the first 15 columns, 2.6 the first
36, 2.7 the first 42, 2.8 all 46. A row is therefore built once at full width
and sliced, which makes "2.5 output is unchanged" a property of the code rather
than something to re-verify each time a column is added.

openPIP fills few columns beyond 15, but not none: interactor type is protein,
the negative flag is false, and a Y2H screen records which protein carried the
DNA-binding domain, so bait and prey are real rather than unspecified. The rest
are "-" because openPIP does not hold that data, not because they were skipped.

Columns 1-15:
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

DONE: TAB 2.6, 2.7 and 2.8 — see COLUMN_NAMES and VERSION_WIDTHS below. 2.8
    closes the paper's commitment ("We furthermore plan to add support to the
    PSI-MI TAB format 2.8", Helmy et al., JMB 2022, Future Directions), though
    its four added columns are CausalTAB and stay empty for a physical-
    interaction portal — see the note on columns 43-46.
TODO(phase5): Register openPIP in PSI-MI controlled vocabulary to get an official MI ID
TODO(phase5): Register in PSICQUIC registry at EBI (https://www.ebi.ac.uk/Tools/webservices/psicquic/registry)
    — the endpoints it validates against now exist: /psicquic/rest/formats and
    /psicquic/rest/version. What remains is the submission itself.
DONE: Rate limiting on /psicquic/ (60/min) and the public API — see
    psicquic/views.py and DEFAULT_THROTTLE_RATES in settings/base.py.
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

# Uploads keep only the label, so the code has to be recovered by name.
LABEL_TO_DETECTION_CODE = {
    label.lower(): code for code, label in DETECTION_METHOD_LABELS.items()
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

# Roles and types for columns 17-22. "unspecified role" is the CV's own term for
# "not recorded", which is honest here — openPIP stores no biological role, and
# an experimental role only where a Y2H screen names the two domains.
ROLE_UNSPECIFIED = ("0499", "unspecified role")
ROLE_BAIT = ("0496", "bait")
ROLE_PREY = ("0498", "prey")
TYPE_PROTEIN = ("0326", "protein")

# The legacy dump stores "no accession" several ways: NULL, the empty string,
# and the literal text "NULL". Only the first two read as falsey in Python, so
# 61 proteins were emitting uniprotkb:NULL as a real identifier.
PLACEHOLDER_IDS = {"", "null", "none", "-", "n/a", "na"}


def _has_id(value) -> bool:
    return bool(value) and str(value).strip().lower() not in PLACEHOLDER_IDS


def _uniprot(protein) -> str:
    if _has_id(protein.uniprot_id):
        return f"uniprotkb:{protein.uniprot_id}"
    return f"openPIP:{protein.pk}"


def _alt_ids(protein) -> str:
    parts = []
    if _has_id(protein.entrez_id):
        parts.append(f"entrez:{protein.entrez_id}")
    if _has_id(protein.ensembl_id):
        parts.append(f"ensembl:{protein.ensembl_id}")
    # Plain .all() so the queryset's prefetch cache is used; adding
    # .select_related() here would re-query once per protein per row.
    for pi in protein.protein_identifiers.all():
        id_obj = pi.identifier
        if id_obj and _has_id(id_obj.identifier) and id_obj.naming_convention:
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
        # PSI-MI TAB wants the scientific name; legacy rows only carry a common
        # name ("human"), so fall back to that rather than emitting nothing.
        return f"taxid:{org.taxonomy_id}({org.scientific_name or org.name})"
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


def _payloads(interaction, type_name: str) -> list[dict]:
    """Parsed annotations of one type, skipping anything unparseable.

    The legacy dump stores these as JSON in a varchar, some with a trailing \\r,
    so a bad row is possible and must not take down a whole PSICQUIC response.
    """
    payloads = []
    for link in interaction.annotation_interactions.all():
        annotation = link.annotation
        if not annotation or annotation.type_name != type_name:
            continue
        try:
            payload = json.loads((annotation.annotation or "").strip())
        except (ValueError, TypeError):
            continue
        if isinstance(payload, dict):
            payloads.append(payload)
    return payloads


def _litbm_payloads(interaction) -> list[dict]:
    return _payloads(interaction, "litbm_interaction")


def _is_y2h(interaction) -> bool:
    """True when the interaction came from one of the two-hybrid screens.

    Detected by the presence of the two Y2H constructs, NOT by the annotation's
    type name. Both the legacy screens and the upload parser write
    type_name="experiment", but they mean different things: legacy stores a JSON
    payload with dna_binding_domain and activation_binding_domain, while
    datasets/upload_parser._handle_detection_method stores a bare method label
    such as "pull down". Keying on the type name alone reported every uploaded
    interaction as two hybrid whatever its actual method.
    """
    return any(
        payload.get("dna_binding_domain") or payload.get("activation_binding_domain")
        for payload in _payloads(interaction, "experiment")
    )


def _uploaded_method_labels(interaction) -> list[str]:
    """Detection-method labels stored by the upload parser.

    datasets/upload_parser._handle_detection_method keeps only the label from
    the uploaded psi-mi:"MI:0018"(two hybrid) cell, so the code has to be
    recovered by name on the way back out. Without this an uploaded dataset
    round-trips its detection method to "-", losing on re-export what it was
    given on import.
    """
    labels = []
    for link in interaction.annotation_interactions.all():
        annotation = link.annotation
        if not annotation or annotation.type_name != "experiment":
            continue
        text = (annotation.annotation or "").strip()
        # Legacy screens store JSON here instead; those are handled as Y2H.
        if text and not text.startswith("{"):
            labels.append(text)
    return labels


def _detection_methods(interaction) -> str:
    """Column 7. Recorded codes first, then uploaded labels, then the Y2H default."""
    codes = {
        str(p["experiment_type"]).strip()
        for p in _litbm_payloads(interaction)
        if p.get("experiment_type")
    }
    if codes:
        return "|".join(
            _psi_mi(code, DETECTION_METHOD_LABELS.get(code)) for code in sorted(codes)
        )

    terms = []
    for label in sorted(set(_uploaded_method_labels(interaction))):
        code = LABEL_TO_DETECTION_CODE.get(label.lower())
        # An unrecognised label still beats "-": name the method even without a
        # code, rather than inventing an MI term for it.
        terms.append(_psi_mi(code, label) if code else f'psi-mi:"{label}"')
    if terms:
        return "|".join(terms)

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


def _experimental_roles(interaction) -> tuple[str, str]:
    """Columns 19/20. A Y2H screen names which protein carried which domain.

    `experiment` annotations record dna_binding_domain (the bait construct) and
    activation_binding_domain (the prey). Matching those gene names against the
    interactors recovers a real experimental role instead of "unspecified" — the
    one piece of genuinely new information 2.6 buys for openPIP.

    The match is by gene name because that is what the annotation stores. If it
    does not line up with either interactor the roles stay unspecified rather
    than being assigned arbitrarily.
    """
    a_gene = (interaction.interactor_A.gene_name or "").strip().upper()
    b_gene = (interaction.interactor_B.gene_name or "").strip().upper()
    unspecified = _psi_mi(*ROLE_UNSPECIFIED)
    if not (a_gene and b_gene):
        return unspecified, unspecified

    for payload in _payloads(interaction, "experiment"):
        bait = (payload.get("dna_binding_domain") or "").strip().upper()
        prey = (payload.get("activation_binding_domain") or "").strip().upper()
        if not (bait and prey):
            continue
        if a_gene == bait and b_gene == prey:
            return _psi_mi(*ROLE_BAIT), _psi_mi(*ROLE_PREY)
        if a_gene == prey and b_gene == bait:
            return _psi_mi(*ROLE_PREY), _psi_mi(*ROLE_BAIT)
    return unspecified, unspecified


def _row(interaction: Interaction) -> list[str]:
    """All 42 MITAB columns for one interaction, in spec order."""
    a = interaction.interactor_A
    b = interaction.interactor_B
    author, pubmed = _publication(interaction)
    score = f"openPIP:{interaction.score}" if interaction.score else "-"
    role_a, role_b = _experimental_roles(interaction)
    unspecified = _psi_mi(*ROLE_UNSPECIFIED)
    protein = _psi_mi(*TYPE_PROTEIN)

    return [
        # ── 1-15: TAB 2.5 ──
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
        # ── 16-36: added by TAB 2.6 ──
        "-",  # 16 complex expansion: the data is binary, nothing was expanded
        unspecified,  # 17 biological role A — not recorded by openPIP
        unspecified,  # 18 biological role B
        role_a,  # 19 experimental role A — bait/prey where Y2H recorded it
        role_b,  # 20 experimental role B
        protein,  # 21 interactor type A
        protein,  # 22 interactor type B
        "-",  # 23 xref A — the cross-references we hold are already in col 3
        "-",  # 24 xref B
        "-",  # 25 interaction xref
        "-",  # 26 annotations A
        "-",  # 27 annotations B
        "-",  # 28 interaction annotations
        "-",  # 29 host organism — the assay host is not recorded per interaction
        "-",  # 30 parameters
        "-",  # 31 creation date — openPIP keeps no per-interaction timestamps
        "-",  # 32 update date
        "-",  # 33 checksum A — ROGID/CRC64 would have to be computed
        "-",  # 34 checksum B
        "-",  # 35 interaction checksum
        "false",  # 36 negative — openPIP stores no negative results
        # ── 37-42: added by TAB 2.7 ──
        "-",  # 37 feature A
        "-",  # 38 feature B
        "-",  # 39 stoichiometry A
        "-",  # 40 stoichiometry B
        "-",  # 41 participant identification method A
        "-",  # 42 participant identification method B
        # ── 43-46: added by TAB 2.8 (CausalTAB) ──
        # All four describe causal, directional regulation: which molecular
        # function drives the effect, by what mechanism, and what the effect on
        # the other participant is. openPIP hosts binary *physical* interactions
        # — Y2H and curated literature — which are undirected and carry no
        # regulatory claim. These are empty because the data is a different
        # kind, not because they were skipped, and they would stay empty for any
        # physical-interaction portal. They are where causal data would go if
        # openPIP ever hosts it.
        "-",  # 43 biological effect of interactor A
        "-",  # 44 biological effect of interactor B
        "-",  # 45 causal regulatory mechanism
        "-",  # 46 causal statement
    ]


COLUMN_NAMES = [
    "ID(s) interactor A",
    "ID(s) interactor B",
    "Alt. ID(s) interactor A",
    "Alt. ID(s) interactor B",
    "Alias(es) interactor A",
    "Alias(es) interactor B",
    "Interaction detection method(s)",
    "Publication 1st author(s)",
    "Publication Identifier(s)",
    "Taxid interactor A",
    "Taxid interactor B",
    "Interaction type(s)",
    "Source database(s)",
    "Interaction identifier(s)",
    "Confidence value(s)",
    "Expansion method(s)",
    "Biological role(s) interactor A",
    "Biological role(s) interactor B",
    "Experimental role(s) interactor A",
    "Experimental role(s) interactor B",
    "Type(s) interactor A",
    "Type(s) interactor B",
    "Xref(s) interactor A",
    "Xref(s) interactor B",
    "Interaction Xref(s)",
    "Annotation(s) interactor A",
    "Annotation(s) interactor B",
    "Interaction annotation(s)",
    "Host organism(s)",
    "Interaction parameter(s)",
    "Creation date",
    "Update date",
    "Checksum(s) interactor A",
    "Checksum(s) interactor B",
    "Interaction Checksum(s)",
    "Negative",
    "Feature(s) interactor A",
    "Feature(s) interactor B",
    "Stoichiometry(s) interactor A",
    "Stoichiometry(s) interactor B",
    "Identification method participant A",
    "Identification method participant B",
    "Biological effect of interactor A",
    "Biological effect of interactor B",
    "Causal regulatory mechanism",
    "Causal statement",
]

# Each version is a prefix of the next, so a width is all that distinguishes them.
VERSION_WIDTHS = {"tab25": 15, "tab26": 36, "tab27": 42, "tab28": 46}

# Kept for the 2.5 callers and tests that predate the other versions.
TAB25_HEADER = "#" + "\t".join(COLUMN_NAMES[: VERSION_WIDTHS["tab25"]])


def header_for(version: str = "tab25") -> str:
    return "#" + "\t".join(COLUMN_NAMES[: VERSION_WIDTHS[version]])


def format_interaction(interaction: Interaction, version: str = "tab25") -> str:
    """Serialize one Interaction as a PSI-MI TAB line at the given version."""
    return "\t".join(_row(interaction)[: VERSION_WIDTHS[version]])


def format_queryset(queryset, version: str = "tab25") -> str:
    """Serialize a queryset of Interactions as PSI-MI TAB text (header + rows)."""
    lines = [header_for(version)]
    for interaction in queryset.select_related(
        "interactor_A", "interactor_B"
    ).prefetch_related(
        "interactor_A__protein_organisms__organism",
        "interactor_B__protein_organisms__organism",
        "interactor_A__protein_identifiers__identifier",
        "interactor_B__protein_identifiers__identifier",
        "interaction_datasets__dataset",
        # Columns 7, 12, 19 and 20 read these; without the prefetch each row
        # costs a query.
        "annotation_interactions__annotation",
    ):
        lines.append(format_interaction(interaction, version))
    return "\n".join(lines)


def format_interaction_tab25(interaction: Interaction) -> str:
    return format_interaction(interaction, "tab25")


def format_queryset_tab25(queryset) -> str:
    return format_queryset(queryset, "tab25")
