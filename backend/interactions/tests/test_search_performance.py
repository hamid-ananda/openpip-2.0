"""
Performance benchmarks for search_service.execute_search().

These tests count SQL queries and wall-clock time to establish a pre/post
optimization baseline.  They do NOT assert specific query counts — that would
make them brittle.  Instead they print a summary table so you can compare
runs before and after a change.

Run with:
    pytest interactions/tests/test_search_performance.py -v -s
"""

import time

import pytest
from django.db import connection, reset_queries
from django.test.utils import override_settings

from datasets.tests.factories import DatasetFactory
from interactions.models import InteractionDataset
from interactions.search_service import (
    build_result_from_interaction_ids,
    execute_search,
)
from interactions.tests.factories import (
    InteractionCategoryFactory,
    InteractionFactory,
    InteractionInteractionCategoryFactory,
)
from proteins.models import Annotation, AnnotationProtein
from proteins.tests.factories import (
    IdentifierFactory,
    ProteinFactory,
    ProteinIdentifierFactory,
)

# ── Fixture helpers ───────────────────────────────────────────────────────────


def _make_protein(gene_name: str) -> object:
    """Create a protein with a matching gene_name identifier."""
    protein = ProteinFactory(gene_name=gene_name)
    ident = IdentifierFactory(identifier=gene_name, naming_convention="gene_name")
    ProteinIdentifierFactory(protein=protein, identifier=ident)
    return protein


def _attach_subcellular(protein) -> None:
    ann = Annotation.objects.create(
        annotation='{"cytosol":"approved","nucleus":"enhanced"}',
        identifier=protein.ensembl_id,
        type_name="subcellular_location",
    )
    AnnotationProtein.objects.create(annotation=ann, protein=protein)


def _attach_tissue(protein) -> None:
    ann = Annotation.objects.create(
        annotation='{"liver":"10.18","lung":"9.04","whole_blood":"8.23"}',
        identifier=protein.ensembl_id,
        type_name="tissue_expression",
    )
    AnnotationProtein.objects.create(annotation=ann, protein=protein)


def _attach_experiment(interaction, label: str) -> None:
    Annotation.objects.create(
        annotation=label,
        identifier=interaction.id,
        type_name="experiment",
    )


# ── Small network (2 query, 10 interactors, 15 interactions) ─────────────────


@pytest.fixture()
def small_network(db):
    """
    Network layout:
        2 query proteins (BAD, BCL2L1) × 5 interactors each → ~15 interactions.
    Every protein has subcellular + tissue annotations.
    Every interaction has a dataset, a category, and an experiment annotation.
    """
    category = InteractionCategoryFactory(category_name="Published", order="1")
    dataset = DatasetFactory(name="HuRI", author="Test et al.")

    query_proteins = [_make_protein("BAD"), _make_protein("BCL2L1")]
    interactors = [_make_protein(f"PARTNER{i}") for i in range(10)]

    all_proteins = query_proteins + interactors
    for p in all_proteins:
        _attach_subcellular(p)
        _attach_tissue(p)

    interactions = []
    for qp in query_proteins:
        for partner in interactors[:5]:
            ix = InteractionFactory(interactor_A=qp, interactor_B=partner, removed="0")
            InteractionDataset.objects.create(interaction=ix, dataset=dataset)
            InteractionInteractionCategoryFactory(
                interaction=ix, interaction_category=category
            )
            _attach_experiment(ix, "Y2H")
            interactions.append(ix)

    # One query↔query edge
    ix_qq = InteractionFactory(
        interactor_A=query_proteins[0], interactor_B=query_proteins[1], removed="0"
    )
    InteractionDataset.objects.create(interaction=ix_qq, dataset=dataset)
    InteractionInteractionCategoryFactory(
        interaction=ix_qq, interaction_category=category
    )
    _attach_experiment(ix_qq, "Co-IP")
    interactions.append(ix_qq)

    return {
        "query_proteins": query_proteins,
        "interactors": interactors,
        "interactions": interactions,
        "category": category,
        "dataset": dataset,
    }


# ── Large network (5 query, 50 interactors, ~100 interactions) ────────────────


@pytest.fixture()
def large_network(db):
    """
    5 query proteins × 20 interactors each → ~100 interactions.
    Simulates a realistic search with a hub gene.
    """
    category = InteractionCategoryFactory(category_name="Published", order="1")
    dataset = DatasetFactory(name="LargeSet", author="Large et al.")

    query_proteins = [_make_protein(f"QGENE{i}") for i in range(5)]
    interactors = [_make_protein(f"INTER{i}") for i in range(50)]

    for p in query_proteins + interactors:
        _attach_subcellular(p)
        _attach_tissue(p)

    interactions = []
    for qp in query_proteins:
        for partner in interactors[:20]:
            ix = InteractionFactory(interactor_A=qp, interactor_B=partner, removed="0")
            InteractionDataset.objects.create(interaction=ix, dataset=dataset)
            InteractionInteractionCategoryFactory(
                interaction=ix, interaction_category=category
            )
            _attach_experiment(ix, "Y2H")
            interactions.append(ix)

    return {
        "query_proteins": query_proteins,
        "interactors": interactors,
        "interactions": interactions,
    }


# ── Benchmark helpers ─────────────────────────────────────────────────────────


def _measure(fn, *args, **kwargs):
    """Return (result, query_count, elapsed_ms)."""
    reset_queries()
    t0 = time.perf_counter()
    result = fn(*args, **kwargs)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    query_count = len(connection.queries)
    return result, query_count, elapsed_ms


# ── Tests ─────────────────────────────────────────────────────────────────────


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_execute_search_small_network_query_count(small_network):
    """Baseline: count SQL queries for a 2-query-protein search on small network."""
    query = "BAD,BCL2L1"
    result, qcount, elapsed = _measure(execute_search, query)

    print(f"\n[small network] execute_search('{query}')")
    print(f"  proteins:     {len(result['all_proteins'])}")
    print(f"  interactions: {len(result['all_interactions'])}")
    print(f"  SQL queries:  {qcount}")
    print(f"  elapsed:      {elapsed:.1f} ms")

    # Sanity: result is populated
    assert len(result["all_proteins"]) > 0
    assert len(result["all_interactions"]) > 0
    assert result["query_protein_id_array"]

    # Guard: no more than 15 queries for a simple search
    # (Each step in the pipeline = 1 query; 8 steps + overhead)
    assert qcount <= 15, f"Too many queries: {qcount}. SQL:\n" + "\n".join(
        q["sql"] for q in connection.queries
    )


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_execute_search_large_network_query_count(large_network):
    """Baseline: query count must stay flat regardless of network size."""
    names = ",".join(p.gene_name for p in large_network["query_proteins"])
    result, qcount, elapsed = _measure(execute_search, names)

    print(
        f"\n[large network] execute_search({len(large_network['query_proteins'])} proteins)"
    )
    print(f"  proteins:     {len(result['all_proteins'])}")
    print(f"  interactions: {len(result['all_interactions'])}")
    print(f"  SQL queries:  {qcount}")
    print(f"  elapsed:      {elapsed:.1f} ms")

    assert len(result["all_proteins"]) > 0
    # Same guard: query count must not grow with network size
    assert qcount <= 15, f"Too many queries: {qcount}. SQL:\n" + "\n".join(
        q["sql"] for q in connection.queries
    )


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_execute_search_filter_modes_query_count(small_network):
    """All three filter modes should use the same number of queries."""
    counts = {}
    for mode in ("None", "query_interactor", "query_query"):
        _, qcount, elapsed = _measure(
            execute_search, "BAD,BCL2L1", filter_parameter=mode
        )
        counts[mode] = (qcount, elapsed)
        print(f"\n  filter={mode!r}: {qcount} queries, {elapsed:.1f} ms")

    # None and query_interactor differ in the SQL but use the same pipeline steps
    for mode, (qcount, _) in counts.items():
        assert qcount <= 15, f"filter={mode}: too many queries ({qcount})"


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_build_result_from_interaction_ids_query_count(small_network):
    """build_result_from_interaction_ids must not N+1 on interaction list."""
    interaction_ids = [ix.id for ix in small_network["interactions"]]
    result, qcount, elapsed = _measure(
        build_result_from_interaction_ids, interaction_ids, "BAD,BCL2L1"
    )

    print(f"\n[build_result] {len(interaction_ids)} interactions")
    print(f"  proteins:     {len(result['all_proteins'])}")
    print(f"  interactions: {len(result['all_interactions'])}")
    print(f"  SQL queries:  {qcount}")
    print(f"  elapsed:      {elapsed:.1f} ms")

    assert len(result["all_interactions"]) > 0
    assert qcount <= 15, f"Too many queries: {qcount}"


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_execute_search_single_term_query_count(small_network):
    """Single-term search: baseline query count."""
    result, qcount, elapsed = _measure(execute_search, "BAD")

    print("\n[single term] execute_search('BAD')")
    print(f"  proteins:     {len(result['all_proteins'])}")
    print(f"  interactions: {len(result['all_interactions'])}")
    print(f"  SQL queries:  {qcount}")
    print(f"  elapsed:      {elapsed:.1f} ms")

    assert result["query_protein_id_array"]
    assert qcount <= 15


@override_settings(DEBUG=True)
@pytest.mark.django_db
def test_execute_search_no_results_query_count(db):
    """Miss path: returning early must not leak extra queries."""
    _, qcount, elapsed = _measure(execute_search, "NONEXISTENT_GENE_XYZ")

    print("\n[no results] execute_search('NONEXISTENT')")
    print(f"  SQL queries: {qcount}")
    print(f"  elapsed:     {elapsed:.1f} ms")

    # Early exit: only the identifier lookup + protein_identifier lookup
    assert qcount <= 3, f"Expected ≤3 queries on miss, got {qcount}"
