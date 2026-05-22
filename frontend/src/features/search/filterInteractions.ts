import type { Protein, Interaction } from '../../types/api'
import type { FilterState } from '../../types/search'

const TISSUE_THRESHOLD = 5.0

function passesTossueFilter(protein: Protein, tissue: string): boolean {
  const raw = (protein.tissue_expression_array as Record<string, string>)[tissue]
  if (raw === undefined) return false
  return parseFloat(raw.replace('\r', '')) >= TISSUE_THRESHOLD
}

export function filterProteinsAndInteractions(
  allProteins: Protein[],
  allInteractions: Interaction[],
  filters: FilterState,
  queryProteinIds: number[]
): { proteins: Protein[]; interactions: Interaction[] } {
  const querySet = new Set(queryProteinIds)

  // Tissue filter — build allowed protein id set first
  let allowedProteinIds: Set<number> | null = null
  if (filters.tissueFilter) {
    allowedProteinIds = new Set(
      allProteins
        .filter((p) => passesTossueFilter(p, filters.tissueFilter))
        .map((p) => p.protein_id)
    )
  }

  let filtered = allInteractions

  if (filters.scoreFilter > 0) {
    filtered = filtered.filter((i) => (i.score ?? 0) >= filters.scoreFilter)
  }

  filtered = filtered.filter((i) => {
    const cat = i.interaction_category_array.highest_category_status
    return filters.categoryFilter[cat] !== false
  })

  if (filters.filterMode === 'query_query') {
    filtered = filtered.filter(
      (i) => querySet.has(i.interactor_A.protein_id) && querySet.has(i.interactor_B.protein_id)
    )
  } else if (filters.filterMode === 'query_interactor') {
    filtered = filtered.filter(
      (i) => querySet.has(i.interactor_A.protein_id) || querySet.has(i.interactor_B.protein_id)
    )
  }

  if (allowedProteinIds) {
    filtered = filtered.filter(
      (i) =>
        allowedProteinIds!.has(i.interactor_A.protein_id) &&
        allowedProteinIds!.has(i.interactor_B.protein_id)
    )
  }

  const proteinIds = new Set(
    filtered.flatMap((i) => [i.interactor_A.protein_id, i.interactor_B.protein_id])
  )

  const proteins = allProteins.filter((p) => proteinIds.has(p.protein_id))

  return { proteins, interactions: filtered }
}
