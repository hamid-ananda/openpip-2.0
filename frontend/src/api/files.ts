import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface UploadedFile {
  id: number
  file_name: string
  file_size: number
  show: boolean
  uploaded_at: string
}

export function useAdminFiles() {
  return useQuery<UploadedFile[]>({
    queryKey: ['admin-files'],
    queryFn: () => apiClient.get('/files').then((r) => r.data),
  })
}

export function usePublicFiles() {
  return useQuery<UploadedFile[]>({
    queryKey: ['public-files'],
    queryFn: () => apiClient.get('/files/public').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUploadFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (form: FormData) =>
      apiClient.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-files'] }),
  })
}

export function useToggleFileVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, show }: { id: number; show: boolean }) =>
      apiClient.patch(`/files/${id}`, { show }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-files'] })
      qc.invalidateQueries({ queryKey: ['public-files'] })
    },
  })
}

export function useDeleteFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/files/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-files'] })
      qc.invalidateQueries({ queryKey: ['public-files'] })
    },
  })
}
