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
