import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export function useContact() {
  return useMutation({
    mutationFn: (body: { name: string; email: string; subject: string; message: string }) =>
      apiClient.post('/contact', body).then((r) => r.data),
  })
}
