import type { Protein, Interaction } from './api'

export interface SearchResult {
  all_proteins: Protein[]
  all_interactions: Interaction[]
  domains: string
  complexes: string
  query_protein_id_array: number[]
  search_term: string
  found_protein_summary: string
  unfound_protein_summary: string
}

export interface QueryParameters {
  searchTerm: string
  searchTermArray: string[]
  filterParameter: 'None' | 'query_query' | 'query_interactor'
  scoreParameter: number
  categoryFilter: Record<string, boolean>
  annotationFilter: Record<string, boolean>
  textOutput: string | null
}

export interface FilterState {
  scoreFilter: number
  categoryFilter: Record<string, boolean>
  annotationFilter: Record<string, boolean>
  filterMode: 'None' | 'query_query' | 'query_interactor'
  tissueFilter: string[]
}
