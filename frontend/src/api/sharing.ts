import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'
import type { UserCard } from './users'
import type { ViewState } from '../features/search/searchStore'

export interface SavedView {
  id: number
  name: string
  query: string
  state: Partial<ViewState>
  created_at: string
  updated_at: string
}

export interface Share {
  id: number
  saved_view: SavedView
  sender: UserCard
  recipient: UserCard
  note: string
  created_at: string
}

export interface ShareComment {
  id: number
  author: UserCard
  body: string
  created_at: string
  edited: boolean
}

export interface Notification {
  id: number
  text: string
  link: string
  read: boolean
  created_at: string
}

export function useSavedViews() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['savedViews'],
    queryFn: () => apiClient.get('/saved-views/').then((r) => r.data as SavedView[]),
    enabled: isLoggedIn,
  })
}

export function useCreateSavedView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name: string; query: string; state: Partial<ViewState> }) =>
      apiClient.post('/saved-views/', body).then((r) => r.data as SavedView),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedViews'] }),
  })
}

export function useDeleteSavedView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/saved-views/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedViews'] }),
  })
}

export function useShares(direction: 'received' | 'sent' = 'received') {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['shares', direction],
    queryFn: () =>
      apiClient.get('/shares/', { params: { direction } }).then((r) => r.data as Share[]),
    enabled: isLoggedIn,
  })
}

export function useShare(id: string | number) {
  return useQuery({
    queryKey: ['share', String(id)],
    queryFn: () => apiClient.get(`/shares/${id}/`).then((r) => r.data as Share),
    enabled: !!id,
    retry: false,
  })
}

export function useCreateShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { saved_view: number; recipient: string; note?: string }) =>
      apiClient.post('/shares/', body).then((r) => r.data as Share),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares'] }),
  })
}

/** Revoke, if you sent it; dismiss, if you received it. */
export function useDeleteShare() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/shares/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shares'] }),
  })
}

export function useShareComments(id: string | number) {
  return useQuery({
    queryKey: ['shareComments', String(id)],
    queryFn: () => apiClient.get(`/shares/${id}/comments`).then((r) => r.data as ShareComment[]),
    enabled: !!id,
    // An open discussion is a live one — poll it like the bell.
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  })
}

/** Only your own messages, and only the text. */
export function useEditComment(id: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, body }: { commentId: number; body: string }) =>
      apiClient
        .patch(`/shares/${id}/comments/${commentId}`, { body })
        .then((r) => r.data as ShareComment),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['shareComments', String(id)] }),
  })
}

export function useAddComment(id: string | number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: string) =>
      apiClient.post(`/shares/${id}/comments`, { body }).then((r) => r.data as ShareComment),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['shareComments', String(id)] }),
  })
}

export function useNotifications() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.get('/notifications/').then((r) => r.data as Notification[]),
    enabled: isLoggedIn,
    // ponytail: polling, not websockets. A share is not urgent enough to keep
    // a socket open per logged-in tab.
    // In background too: a second window watching for a share is exactly the
    // case that matters, and that window is by definition not the focused one.
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
  })
}

export function useClearNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.post('/notifications/clear/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.patch(`/notifications/${id}/`, { read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
