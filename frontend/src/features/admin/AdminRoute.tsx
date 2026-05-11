import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface AdminRouteProps { children: React.ReactNode }

export function AdminRoute({ children }: AdminRouteProps) {
  const isAdmin = useAuthStore((s) => s.isAdmin)
  if (!isAdmin) return <Navigate to="/login" replace />
  return <>{children}</>
}
