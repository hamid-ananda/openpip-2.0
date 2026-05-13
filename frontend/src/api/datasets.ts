import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface InteractionCategory {
  id: number
  category_name: string
  order: string
}

export interface DatasetPreviewResult {
  dry_run: boolean
  proteins_created: number
  proteins_existing: number
  interactions_created: number
  interactions_skipped: number
  errors: string[]
}

export function useInteractionCategories() {
  return useQuery<InteractionCategory[]>({
    queryKey: ['interaction-categories'],
    queryFn: () => apiClient.get('/interactions/categories').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  })
}

export function useDatasetPreview() {
  return useMutation<DatasetPreviewResult, Error, FormData>({
    mutationFn: (formData) =>
      apiClient
        .post('/datasets/preview', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
  })
}

export function useDatasetUpload() {
  const queryClient = useQueryClient()
  return useMutation<DatasetPreviewResult, Error, FormData>({
    mutationFn: (formData) =>
      apiClient
        .post('/datasets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      queryClient.invalidateQueries({ queryKey: ['counts'] })
    },
  })
}
