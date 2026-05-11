import { describe, it, expect } from 'vitest'
import { getEdgeColor, buildElements } from '../cytoscapeElements'
import { NETWORK_STYLESHEET } from '../cytoscapeStyles'
import type { Protein, Interaction } from '../../../../types/api'

// Minimal Protein fixture
function makeProtein(overrides: Partial<Protein> & { protein_id: number; protein_gene_name: string }): Protein {
  return {
    protein_uniprot_id: 'Q00001',
    protein_ensembl_id: 'ENSP00000000001',
    protein_entrez_id: '1',
    protein_protein_name: 'Test Protein',
    protein_description: 'A test protein',
    protein_sequence: 'MSEQ',
    number_of_interactions_in_database: 0,
    annotation_array: {},
    tissue_expression_array: {},
    subcellular_location_expression_array: {},
    ...overrides,
  }
}

// Minimal Interaction fixture
function makeInteraction(
  overrides: {
    interaction_id: number
    aId: number
    bId: number
    categoryStatus: string
    score?: number | null
  }
): Interaction {
  return {
    interaction_id: overrides.interaction_id,
    interactor_A: {
      protein_id: overrides.aId,
      protein_uniprot_id: 'Q00001',
      protein_gene_name: 'GENE_A',
      protein_ensembl_id: 'ENSP00000000001',
    },
    interactor_B: {
      protein_id: overrides.bId,
      protein_uniprot_id: 'Q00002',
      protein_gene_name: 'GENE_B',
      protein_ensembl_id: 'ENSP00000000002',
    },
    score: overrides.score ?? 0.9,
    annotation_array: {},
    experiment_array: [],
    dataset_array: [],
    interaction_category_array: {
      highest_category_status: overrides.categoryStatus,
      highest_order: 1,
      interaction_category_array: [],
    },
  }
}

describe('getEdgeColor', () => {
  it('returns #ff0000 for Literature', () => {
    expect(getEdgeColor('Literature')).toBe('#ff0000')
  })

  it('returns #0000ff for Published', () => {
    expect(getEdgeColor('Published')).toBe('#0000ff')
  })

  it('returns #00aa00 for Validated', () => {
    expect(getEdgeColor('Validated')).toBe('#00aa00')
  })

  it('returns #aa00aa for Verified', () => {
    expect(getEdgeColor('Verified')).toBe('#aa00aa')
  })

  it('returns #ff55dd for Mixed', () => {
    expect(getEdgeColor('Mixed')).toBe('#ff55dd')
  })

  it('returns #cccccc for unknown category', () => {
    expect(getEdgeColor('UnknownCategory')).toBe('#cccccc')
  })
})

describe('buildElements — node structure', () => {
  const proteins = [
    makeProtein({ protein_id: 1, protein_gene_name: 'BRCA1' }),
    makeProtein({ protein_id: 2, protein_gene_name: 'TP53' }),
  ]
  const queryProteinIds = [1]
  const elements = buildElements(proteins, [], queryProteinIds)

  it('produces one node per protein', () => {
    const nodes = elements.filter((el) => !el.data.source)
    expect(nodes).toHaveLength(2)
  })

  it('node for protein 1 has correct id and label', () => {
    const node = elements.find((el) => el.data.id === 'p1')
    expect(node).toBeDefined()
    expect(node!.data.label).toBe('BRCA1')
  })

  it('query protein has isQuery=true', () => {
    const node = elements.find((el) => el.data.id === 'p1')
    expect(node!.data.isQuery).toBe(true)
  })

  it('non-query protein has isQuery=false', () => {
    const node = elements.find((el) => el.data.id === 'p2')
    expect(node!.data.isQuery).toBe(false)
  })
})

describe('buildElements — edge structure', () => {
  const proteins = [
    makeProtein({ protein_id: 1, protein_gene_name: 'BRCA1' }),
    makeProtein({ protein_id: 2, protein_gene_name: 'TP53' }),
  ]
  const interactions = [
    makeInteraction({ interaction_id: 42, aId: 1, bId: 2, categoryStatus: 'Literature', score: 0.9 }),
  ]
  const elements = buildElements(proteins, interactions, [1])

  it('produces one edge for the interaction', () => {
    const edges = elements.filter((el) => el.data.source !== undefined)
    expect(edges).toHaveLength(1)
  })

  it('edge has correct id', () => {
    const edge = elements.find((el) => el.data.id === 'i42')
    expect(edge).toBeDefined()
  })

  it('edge has correct source and target', () => {
    const edge = elements.find((el) => el.data.id === 'i42')!
    expect(edge.data.source).toBe('p1')
    expect(edge.data.target).toBe('p2')
  })

  it('edge has correct color for Literature', () => {
    const edge = elements.find((el) => el.data.id === 'i42')!
    expect(edge.data.color).toBe('#ff0000')
  })

  it('edge has correct score', () => {
    const edge = elements.find((el) => el.data.id === 'i42')!
    expect(edge.data.score).toBe(0.9)
  })

  it('edge has correct category', () => {
    const edge = elements.find((el) => el.data.id === 'i42')!
    expect(edge.data.category).toBe('Literature')
  })
})

describe('buildElements — Mixed edge color', () => {
  const proteins = [
    makeProtein({ protein_id: 1, protein_gene_name: 'A' }),
    makeProtein({ protein_id: 2, protein_gene_name: 'B' }),
  ]
  const interactions = [
    makeInteraction({ interaction_id: 1, aId: 1, bId: 2, categoryStatus: 'Mixed' }),
  ]

  it('Mixed interaction edge color is #ff55dd', () => {
    const elements = buildElements(proteins, interactions, [])
    const edge = elements.find((el) => el.data.id === 'i1')!
    expect(edge.data.color).toBe('#ff55dd')
  })
})

describe('NETWORK_STYLESHEET', () => {
  it('has at least 4 selectors', () => {
    expect(NETWORK_STYLESHEET.length).toBeGreaterThanOrEqual(4)
  })

  it('includes a node selector', () => {
    const selectors = NETWORK_STYLESHEET.map((block) => (block as { selector: string }).selector)
    expect(selectors).toContain('node')
  })

  it('includes node[?isQuery] selector', () => {
    const selectors = NETWORK_STYLESHEET.map((block) => (block as { selector: string }).selector)
    expect(selectors).toContain('node[?isQuery]')
  })

  it('includes node[!isQuery] selector', () => {
    const selectors = NETWORK_STYLESHEET.map((block) => (block as { selector: string }).selector)
    expect(selectors).toContain('node[!isQuery]')
  })

  it('includes an edge selector', () => {
    const selectors = NETWORK_STYLESHEET.map((block) => (block as { selector: string }).selector)
    expect(selectors).toContain('edge')
  })
})
