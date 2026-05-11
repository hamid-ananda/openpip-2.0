import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { DatasetRef } from '../types/api'

export function useDatasets() {
  return useQuery<DatasetRef[]>({
    queryKey: ['datasets'],
    queryFn: () => apiClient.get('/datasets').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
}
