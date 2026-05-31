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
  6  Interaction detection method - (not in schema)
  7  Publication first author     Foo et al.(2020) or -
  8  Publication ID               pubmed:12345678 or -
  9  Taxon interactor A           taxid:9606(Homo sapiens) or -
 10  Taxon interactor B           taxid:9606(Homo sapiens) or -
 11  Interaction type             - (category name is not a PSI-MI CV term)
 12  Source database              openPIP:openPIP
 13  Interaction ID               openPIP:{id}
 14  Confidence score             openPIP:{score} or -

TODO(phase5): TAB 2.6 adds biological roles, experimental roles, interactor types
TODO(phase5): TAB 2.7 adds xrefs, host organism, checksums, negative flag
TODO(phase5): TAB 2.8 adds features (domains/binding sites), stoichiometry, identification methods
TODO(phase5): Register openPIP in PSI-MI controlled vocabulary to get an official MI ID
TODO(phase5): Register in PSICQUIC registry at EBI (https://www.ebi.ac.uk/Tools/webservices/psicquic/registry)
TODO(phase5): Rate limiting on /psicquic/ endpoints
TODO(phase5): PyPI publishing of openpip package
"""

from interactions.models import Interaction

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
    for pi in protein.protein_identifiers.select_related("identifier").all():
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


def _taxon(protein) -> str:
    po = protein.protein_organisms.select_related("organism").first()
    if po and po.organism:
        org = po.organism
        return f"taxid:{org.taxonomy_id}({org.name})"
    return "-"


def _publication(interaction) -> tuple[str, str]:
    """Returns (author, pubmed_id) from the first linked dataset."""
    id_link = interaction.interaction_datasets.select_related("dataset").first()
    if not id_link or not id_link.dataset:
        return "-", "-"
    dataset = id_link.dataset
    author = dataset.author or "-"
    pubmed = f"pubmed:{dataset.pubmed_id}" if dataset.pubmed_id else "-"
    return author, pubmed


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
        "-",
        author,
        pubmed,
        _taxon(a),
        _taxon(b),
        "-",
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
    ):
        lines.append(format_interaction_tab25(interaction))
    return "\n".join(lines)
