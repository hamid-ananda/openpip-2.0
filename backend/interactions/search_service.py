"""
Search algorithm: mirrors legacy SearchController.getInteractionData() pipeline.
Pure function — no HTTP, no DRF. Returns a plain dict.

Filter modes (filter_parameter):
  'None'            — all proteins connected to any query protein; all interactions among that set
  'query_interactor'— same interactor expansion; only interactions where one side is a query protein
  'query_query'     — only query proteins; only interactions between query proteins
"""
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


def _nested(p: Protein) -> dict:
    return {
        'protein_id': p.id,
        'protein_uniprot_id': p.uniprot_id or '',
        'protein_gene_name': p.gene_name or '',
        'protein_ensembl_id': p.ensembl_id or '',
    }


def _build_interaction_dict(
    ix: Interaction,
    a_protein: Protein,
    b_protein: Protein,
    datasets_by_interaction: dict,
    categories_by_interaction: dict,
    annotations_by_interaction: dict,
) -> dict:
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
    client-side in the frontend. Only filter_parameter changes the SQL query shape.
    """
    terms = [t.strip() for t in q.split(',') if t.strip()]

    # Step 1: Resolve query proteins via identifier table
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

    found_gene_names = set(
        Protein.objects.filter(id__in=query_protein_ids).values_list('gene_name', flat=True)
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

    # Step 2: Find interactor ID set
    # Fix of legacy bug: apply removed='0' before the OR split so both sides are guarded.
    if filter_parameter in ('None', 'query_interactor'):
        connected = (
            Interaction.objects.filter(removed='0')
            .filter(
                Q(interactor_A_id__in=query_protein_ids) |
                Q(interactor_B_id__in=query_protein_ids)
            )
            .values_list('interactor_A_id', 'interactor_B_id')
        )
        # Always include query proteins even when they have no interactions
        interactor_id_set = set(query_protein_ids)
        for a_id, b_id in connected:
            interactor_id_set.add(a_id)
            interactor_id_set.add(b_id)
        interactor_ids = list(interactor_id_set)
    else:  # query_query
        interactor_ids = query_protein_ids

    # Step 3: Find final interactions
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

    # Step 4: Build protein nodes
    protein_map = {p.id: p for p in Protein.objects.filter(id__in=interactor_ids)}

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

    # Steps 5-6: Batch fetch datasets + categories
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

    # Step 7: Interaction annotations (queried via annotation.identifier)
    annotations_by_interaction = {}
    for ann in Annotation.objects.filter(identifier__in=interaction_ids):
        annotations_by_interaction.setdefault(ann.identifier, []).append(ann)

    # Step 8: Classify edges + build output
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
