import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Counts } from '../types/api'

export function useCounts() {
  return useQuery<Counts>({
    queryKey: ['counts'],
    queryFn: () => apiClient.get('/counts').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
