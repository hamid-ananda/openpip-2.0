import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { InteractionCategory } from '../types/api'

export function useInteractionCategories() {
  return useQuery<InteractionCategory[]>({
    queryKey: ['interaction-categories'],
    queryFn: () => apiClient.get('/interaction-categories').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<InteractionCategory, 'id'>) =>
      apiClient.post('/interaction-categories', data).then((r) => r.data as InteractionCategory),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interaction-categories'] }),
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<InteractionCategory> & { id: number }) =>
      apiClient
        .patch(`/interaction-categories/${id}`, data)
        .then((r) => r.data as InteractionCategory),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interaction-categories'] }),
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/interaction-categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interaction-categories'] }),
  })
}
