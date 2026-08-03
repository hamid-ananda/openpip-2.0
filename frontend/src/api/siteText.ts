import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { SiteTextResponse, SiteTextEntry } from '../types/api'

export const SITE_TEXT_QUERY_KEY = ['site-text'] as const

/**
 * Admin overrides for user-facing copy.
 *
 * Returns only the keys an admin has customized. Consumers merge these over
 * the compiled-in defaults in `src/text`, so a slow or failed fetch degrades to
 * the shipped copy rather than a blank page.
 */
export function useSiteText() {
  return useQuery<SiteTextResponse>({
    queryKey: SITE_TEXT_QUERY_KEY,
    queryFn: () => apiClient.get('/settings/text').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Bulk-writes overrides. A `null` value clears the override so the shipped
 * default takes over again; an empty string is stored as a deliberate blank.
 */
export function useUpdateSiteText() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (entries: SiteTextEntry[]) =>
      apiClient.put('/settings/text', { entries }).then((r) => r.data as SiteTextResponse),
    onSuccess: (updated) => {
      queryClient.setQueryData(SITE_TEXT_QUERY_KEY, updated)
    },
  })
}
