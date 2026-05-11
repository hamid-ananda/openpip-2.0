import { useNavigate } from 'react-router-dom'
import { useProfile, useLogout } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

export function ProfilePage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutate: logout, isPending } = useLogout()

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4 text-center">
        <p className="text-gray-600 mb-4">You are not logged in.</p>
        <a href="/login" style={{ color: 'var(--color-main)' }}>
          Log in
        </a>
      </div>
    )
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-main)' }}>
        My Profile
      </h1>
      <div className="border rounded p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-600">Username</span>
          <span>{profile?.username ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-600">Email</span>
          <span>{profile?.email ?? '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-600">Role</span>
          <span>{profile?.is_admin ? 'Administrator' : 'User'}</span>
        </div>
      </div>
      <button
        onClick={() => logout(undefined, { onSuccess: () => navigate('/') })}
        disabled={isPending}
        className="w-full py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-60"
      >
        {isPending ? 'Logging out...' : 'Log Out'}
      </button>
    </div>
  )
}
