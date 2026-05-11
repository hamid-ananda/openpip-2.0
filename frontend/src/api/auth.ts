import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      apiClient.post('/auth/login', body).then((r) => r.data),
    onSuccess: (data) => login(data.access, data.is_admin),
  })
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout)
  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout').then((r) => r.data),
    onSuccess: () => logout(),
  })
}
