import { describe, it, expect } from 'vitest'
import { filterProteinsAndInteractions, tissuesWithData } from './filterInteractions'
import type { Protein, Interaction } from '../../types/api'
import type { FilterState } from '../../types/search'

const makeProtein = (id: number, gene: string): Protein => ({
  protein_id: id, protein_uniprot_id: `P${id}`, protein_ensembl_id: `E${id}`,
  protein_entrez_id: `${id}`, protein_gene_name: gene, protein_protein_name: gene,
  protein_description: '', protein_sequence: '', number_of_interactions_in_database: 1,
  annotation_array: {}, tissue_expression_array: {}, subcellular_location_expression_array: {},
})

const makeInteraction = (id: number, aId: number, bId: number, score: number, category: string): Interaction => ({
  interaction_id: id,
  interactor_A: { protein_id: aId, protein_uniprot_id: `P${aId}`, protein_gene_name: `G${aId}`, protein_ensembl_id: `E${aId}` },
  interactor_B: { protein_id: bId, protein_uniprot_id: `P${bId}`, protein_gene_name: `G${bId}`, protein_ensembl_id: `E${bId}` },
  score,
  annotation_array: {},
  experiment_array: [],
  dataset_array: [],
  interaction_category_array: {
    highest_category_status: category,
    highest_order: 1,
    interaction_category_array: [{ category_name: category, order: 1 }],
  },
})

const defaultFilters: FilterState = {
  scoreFilter: 0,
  categoryFilter: { Published: true, Validated: true, Verified: true, Literature: true },
  annotationFilter: {},
  filterMode: 'None',
  tissueFilter: '',
}

const proteins = [makeProtein(1, 'BAD'), makeProtein(2, 'BCL2L1'), makeProtein(3, 'BAK1')]
const interactions = [
  makeInteraction(1, 1, 2, 0.8, 'Published'),
  makeInteraction(2, 2, 3, 0.3, 'Literature'),
  makeInteraction(3, 1, 3, 0.6, 'Validated'),
]

describe('filterProteinsAndInteractions', () => {
  it('returns all proteins and interactions with default filters', () => {
    const result = filterProteinsAndInteractions(proteins, interactions, defaultFilters, [1, 2])
    expect(result.interactions).toHaveLength(3)
    expect(result.proteins).toHaveLength(3)
  })

  it('filters by score threshold', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, scoreFilter: 0.5 }, [1, 2])
    expect(result.interactions).toHaveLength(2)
    expect(result.interactions.every(i => (i.score ?? 0) >= 0.5)).toBe(true)
  })

  it('filters out disabled categories', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, categoryFilter: { ...defaultFilters.categoryFilter, Literature: false } }, [1, 2])
    expect(result.interactions).toHaveLength(2)
    expect(result.interactions.every(i => i.interaction_category_array.highest_category_status !== 'Literature')).toBe(true)
  })

  it('filterMode query_query only keeps query-query interactions', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, filterMode: 'query_query' }, [1, 2])
    expect(result.interactions).toHaveLength(1)
    expect(result.interactions[0].interaction_id).toBe(1)
  })

  it('filterMode query_interactor keeps interactions with at least one query protein', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, filterMode: 'query_interactor' }, [1, 2])
    expect(result.interactions).toHaveLength(3)
  })

  it('tissueFilter hides proteins below the 5.0 expression threshold', () => {
    const p1 = { ...makeProtein(1, 'BAD'),    tissue_expression_array: { liver: '8.5' } }
    const p2 = { ...makeProtein(2, 'BCL2L1'), tissue_expression_array: { liver: '3.0' } } // below threshold
    const p3 = { ...makeProtein(3, 'BAK1'),   tissue_expression_array: { liver: '6.2' } }
    const ixs = [
      makeInteraction(1, 1, 2, 0.8, 'Published'), // p2 filtered → removed
      makeInteraction(2, 1, 3, 0.7, 'Published'), // both pass → kept
    ]
    const result = filterProteinsAndInteractions([p1, p2, p3], ixs,
      { ...defaultFilters, tissueFilter: 'liver' }, [1])
    expect(result.interactions).toHaveLength(1)
    expect(result.interactions[0].interaction_id).toBe(2)
    expect(result.proteins.map(p => p.protein_id)).not.toContain(2)
  })

  it('tissueFilter strips \\r from stored values before comparing', () => {
    const p1 = { ...makeProtein(1, 'BAD'),    tissue_expression_array: { liver: '7.1\r' } }
    const p2 = { ...makeProtein(2, 'BCL2L1'), tissue_expression_array: { liver: '6.0\r' } }
    const ixs = [makeInteraction(1, 1, 2, 0.8, 'Published')]
    const result = filterProteinsAndInteractions([p1, p2], ixs,
      { ...defaultFilters, tissueFilter: 'liver' }, [1])
    expect(result.interactions).toHaveLength(1)
  })

  it('tissueFilter empty string returns all proteins', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, tissueFilter: '' }, [1, 2])
    expect(result.interactions).toHaveLength(3)
  })

  it('proteins in result are only those in surviving interactions', () => {
    const result = filterProteinsAndInteractions(proteins, interactions,
      { ...defaultFilters, scoreFilter: 0.5 }, [1, 2])
    // score >= 0.5: interactions 1 (0.8, P1-P2) and 3 (0.6, P1-P3) survive → proteins 1, 2, 3 all present
    expect(result.proteins).toHaveLength(3)
  })
})

describe('tissuesWithData', () => {
  const withTissues = (id: number, tissues: Record<string, string>): Protein => ({
    ...makeProtein(id, `G${id}`),
    tissue_expression_array: tissues,
  })

  it('offers only tissues some protein passes the 5.0 threshold for', () => {
    const proteins = [
      withTissues(1, { liver: '9.9', skin: '0.4' }),
      withTissues(2, { liver: '1.1', brain_1: '7.2' }),
    ]
    // skin is present in the data but nowhere near the threshold, so filtering
    // by it would return an empty network.
    expect(tissuesWithData(proteins).sort()).toEqual(['brain_1', 'liver'])
  })

  it('tolerates the trailing \\r the legacy dump stores', () => {
    expect(tissuesWithData([withTissues(1, { liver: '9.9\r' })])).toEqual(['liver'])
  })

  it('returns nothing when no protein carries tissue data', () => {
    expect(tissuesWithData([makeProtein(1, 'G1')])).toEqual([])
  })
})
