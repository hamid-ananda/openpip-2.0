import type { Protein, Interaction } from '../../types/api'
import type { FilterState } from '../../types/search'

export function filterProteinsAndInteractions(
  allProteins: Protein[],
  allInteractions: Interaction[],
  filters: FilterState,
  queryProteinIds: number[]
): { proteins: Protein[]; interactions: Interaction[] } {
  const querySet = new Set(queryProteinIds)

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

  const proteinIds = new Set(
    filtered.flatMap((i) => [i.interactor_A.protein_id, i.interactor_B.protein_id])
  )

  const proteins = allProteins.filter((p) => proteinIds.has(p.protein_id))

  return { proteins, interactions: filtered }
}
