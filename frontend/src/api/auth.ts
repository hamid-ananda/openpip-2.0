import { useMutation, useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'

export function useLogin() {
  const login = useAuthStore((s) => s.login)
  return useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      apiClient.post('/auth/login', body).then((r) => r.data),
    onSuccess: (data) => login(data.access, data.refresh, data.is_admin),
  })
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore()
  return useMutation({
    mutationFn: () =>
      apiClient.post('/auth/logout', { refresh: refreshToken }).then((r) => r.data),
    onSettled: () => logout(),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: { username: string; email: string; password: string }) =>
      apiClient.post('/auth/register', body).then((r) => r.data),
  })
}

export function useProfile() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  return useQuery({
    queryKey: ['profile'],
    queryFn: () =>
      apiClient
        .get('/auth/me')
        .then((r) => r.data as { username: string; email: string; is_admin: boolean }),
    enabled: isLoggedIn,
    staleTime: 2 * 60 * 1000,
  })
}
