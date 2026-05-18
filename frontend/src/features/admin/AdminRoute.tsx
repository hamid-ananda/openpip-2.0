import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface AdminRouteProps { children: React.ReactNode }

export function AdminRoute({ children }: AdminRouteProps) {
  const { isLoggedIn, isAdmin } = useAuthStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}
