import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type { AdminUser } from '../types/api'

/** Existing accounts an admin can promote. Admins sort first. */
export function useAdminUsers(search: string = '') {
  return useQuery<AdminUser[]>({
    queryKey: ['admin-users', search],
    queryFn: () =>
      apiClient
        .get('/admin/users', { params: search ? { search } : undefined })
        .then((r) => r.data),
    staleTime: 30 * 1000,
  })
}

/**
 * Grants or revokes admin access on an account that already exists.
 * Registration never confers it, so this is the only path to a new admin.
 *
 * The API refuses self-revocation and revoking a superuser; the UI disables
 * those buttons, but the server is what enforces it.
 */
export function useSetAdminAccess() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: number; isAdmin: boolean }) =>
      apiClient.patch(`/admin/users/${userId}`, { isAdmin }).then((r) => r.data as AdminUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}
