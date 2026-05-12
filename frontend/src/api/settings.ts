import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminSettings } from '../types/api'

export function useSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminSettings>) =>
      apiClient.patch('/settings', data).then((r) => r.data as AdminSettings),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated)
    },
  })
}

export function useUploadLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('logo', file)
      return apiClient
        .post('/settings/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((r) => r.data as AdminSettings)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated)
    },
  })
}

export function useDeleteLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.delete('/settings/logo').then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}
