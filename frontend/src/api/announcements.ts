import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Announcement } from '../types/api'

export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => apiClient.get('/announcements').then((r) => r.data),
    staleTime: 60 * 1000,
  })
}

export function useAdminAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ['admin-announcements'],
    queryFn: () => apiClient.get('/admin/announcements').then((r) => r.data),
    staleTime: 0,
  })
}

export interface AnnouncementPayload {
  title: string
  text: string
  date?: string | null
  show?: boolean
  showOnHomePage?: boolean
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AnnouncementPayload) =>
      apiClient.post('/admin/announcements', data).then((r) => r.data as Announcement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AnnouncementPayload> }) =>
      apiClient.patch(`/admin/announcements/${id}`, data).then((r) => r.data as Announcement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
