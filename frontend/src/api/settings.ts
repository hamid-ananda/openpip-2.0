import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminSettings } from '../types/api'

export function useSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}
