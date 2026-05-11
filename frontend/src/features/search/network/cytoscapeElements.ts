import type { ElementDefinition } from 'cytoscape'
import type { Protein, Interaction } from '../../../types/api'

const EDGE_COLORS: Record<string, string> = {
  Literature: '#ff0000',
  Published: '#0000ff',
  Validated: '#00aa00',
  Verified: '#aa00aa',
  Mixed: '#ff55dd',
}

const FALLBACK_COLOR = '#cccccc'

export function getEdgeColor(categoryStatus: string): string {
  return EDGE_COLORS[categoryStatus] ?? FALLBACK_COLOR
}

export function buildElements(
  proteins: Protein[],
  interactions: Interaction[],
  queryProteinIds: number[]
): ElementDefinition[] {
  const querySet = new Set(queryProteinIds)

  const nodes: ElementDefinition[] = proteins.map((protein) => ({
    data: {
      id: `p${protein.protein_id}`,
      label: protein.protein_gene_name,
      isQuery: querySet.has(protein.protein_id),
    },
  }))

  const edges: ElementDefinition[] = interactions.map((interaction) => {
    const categoryStatus = interaction.interaction_category_array.highest_category_status
    return {
      data: {
        id: `i${interaction.interaction_id}`,
        source: `p${interaction.interactor_A.protein_id}`,
        target: `p${interaction.interactor_B.protein_id}`,
        color: getEdgeColor(categoryStatus),
        score: interaction.score,
        category: categoryStatus,
      },
    }
  })

  return [...nodes, ...edges]
}
