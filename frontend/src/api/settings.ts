import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminSettings } from '../types/api'

/**
 * Legacy copy (the FAQ especially) was pasted from a word processor with
 * `&nbsp;` between every word. A whole paragraph of those is one unbreakable
 * word, so the browser cannot wrap it and the page scrolls sideways. Normalise
 * on read, so every consumer of the settings HTML gets wrappable text.
 */
function unstickSpaces(settings: AdminSettings): AdminSettings {
  return Object.fromEntries(
    Object.entries(settings).map(([k, v]) => [
      k,
      typeof v === 'string' ? v.replace(/&nbsp;/g, ' ') : v,
    ]),
  ) as AdminSettings
}

export function useSettings() {
  return useQuery<AdminSettings>({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => unstickSpaces(r.data)),
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
      // Also invalidate to force ThemeProvider to re-run injectCSSVars with fresh data
      queryClient.invalidateQueries({ queryKey: ['settings'] })
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
