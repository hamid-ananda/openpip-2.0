import type { ElementDefinition } from 'cytoscape'
import type { Protein, Interaction } from '../../../types/api'

export interface EdgeColorPalette {
  published: string   // order 1
  validated: string   // order 2
  verified: string    // order 3
  literature: string  // order 4
}

const DEFAULT_PALETTE: EdgeColorPalette = {
  published: '#38761d',
  validated: '#1155cc',
  verified: '#cc0000',
  literature: '#ff9900',
}

const FALLBACK_COLOR = '#cccccc'

export function getEdgeColorByOrder(order: number, palette: EdgeColorPalette = DEFAULT_PALETTE): string {
  switch (order) {
    case 1: return palette.published
    case 2: return palette.validated
    case 3: return palette.verified
    case 4: return palette.literature
    default: return FALLBACK_COLOR
  }
}

export function buildElements(
  proteins: Protein[],
  interactions: Interaction[],
  queryProteinIds: number[],
  palette: EdgeColorPalette = DEFAULT_PALETTE
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
    const { highest_category_status, highest_order } = interaction.interaction_category_array
    return {
      data: {
        id: `i${interaction.interaction_id}`,
        source: `p${interaction.interactor_A.protein_id}`,
        target: `p${interaction.interactor_B.protein_id}`,
        color: getEdgeColorByOrder(highest_order, palette),
        score: interaction.score,
        category: highest_category_status,
      },
    }
  })

  return [...nodes, ...edges]
}
