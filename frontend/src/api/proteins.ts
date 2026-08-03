import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

/** Rows fetched per page of the browsable protein list. */
export const PROTEIN_PAGE_SIZE = 100

export function useAutocomplete(q: string) {
  return useQuery<string[]>({
    queryKey: ['autocomplete', q],
    queryFn: () => apiClient.get('/proteins/autocomplete', { params: { q } }).then((r) => r.data),
    enabled: q.length >= 2,
    staleTime: 60 * 1000,
  })
}

export interface ProteinDetail {
  protein_id: number
  protein_gene_name: string
  protein_protein_name: string
  protein_uniprot_id: string
  protein_ensembl_id: string
  protein_entrez_id: string
  protein_description: string
  protein_sequence: string
  number_of_interactions_in_database: number
  annotation_array: Record<string, string[]>
  tissue_expression_array: Record<string, string>
  subcellular_location_expression_array: Record<string, string>
  identifiers: { identifier: string; naming_convention: string }[]
}

export function useProtein(identifier: string) {
  return useQuery<ProteinDetail>({
    queryKey: ['protein', identifier],
    queryFn: () =>
      apiClient.get(`/proteins/${encodeURIComponent(identifier)}`).then((r) => r.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  })
}

/** One row of the browsable protein list — deliberately lighter than ProteinDetail. */
export interface ProteinListRow {
  protein_id: number
  protein_gene_name: string
  protein_protein_name: string
  protein_uniprot_id: string
  number_of_interactions_in_database: number
  has_sequence: boolean
}

export interface ProteinListPage {
  count: number
  next: string | null
  previous: string | null
  results: ProteinListRow[]
}

export type ProteinOrdering = 'gene' | '-gene' | 'interactions' | '-interactions'

export interface ProteinListParams {
  q?: string
  ordering?: ProteinOrdering
  hasInteractions?: boolean
  hasSequence?: boolean
  hasStructure?: boolean
  includeEmpty?: boolean
}

/**
 * Paged protein list. The catalogue is ~11.6k named proteins, so the list is
 * fetched a page at a time and searched server-side rather than filtered from
 * a partial client cache.
 */
export function useProteinList(params: ProteinListParams) {
  const { q = '', ordering = 'gene' } = params

  return useInfiniteQuery<ProteinListPage>({
    queryKey: ['proteins', params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      apiClient
        .get('/proteins', {
          params: {
            // Falsy flags are omitted rather than sent as "false" — the
            // backend only ever opts filters in.
            ...(q ? { q } : {}),
            ordering,
            ...(params.hasInteractions ? { has_interactions: 'true' } : {}),
            ...(params.hasSequence ? { has_sequence: 'true' } : {}),
            ...(params.hasStructure ? { has_structure: 'true' } : {}),
            ...(params.includeEmpty ? { include_empty: 'true' } : {}),
            limit: PROTEIN_PAGE_SIZE,
            offset: pageParam,
          },
        })
        .then((r) => r.data),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((total, page) => total + page.results.length, 0)
      return loaded < lastPage.count ? loaded : undefined
    },
    staleTime: 5 * 60 * 1000,
  })
}

export interface ProteinInteractor {
  protein_id: number
  protein_gene_name: string
  protein_protein_name: string
  protein_uniprot_id: string
  number_of_interactions_in_database: number
  shared_interaction_count: number
}

export interface ProteinInteractorsResponse {
  count: number
  results: ProteinInteractor[]
}

export function useProteinInteractors(identifier: string, limit = 10) {
  return useQuery<ProteinInteractorsResponse>({
    queryKey: ['protein-interactors', identifier, limit],
    queryFn: () =>
      apiClient
        .get(`/proteins/${encodeURIComponent(identifier)}/interactors`, {
          params: { limit },
        })
        .then((r) => r.data),
    enabled: !!identifier,
    staleTime: 5 * 60 * 1000,
  })
}
