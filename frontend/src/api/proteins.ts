import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

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
