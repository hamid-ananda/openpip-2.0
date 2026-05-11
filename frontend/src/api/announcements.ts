import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Announcement } from '../types/api'

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get('/announcements').then((r) => r.data),
    staleTime: 60 * 1000,
  })
}
