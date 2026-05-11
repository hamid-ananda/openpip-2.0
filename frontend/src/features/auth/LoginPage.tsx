import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogin } from '../../api/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { mutate: login, isPending, error } = useLogin()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login({ username, password }, { onSuccess: () => navigate('/') })
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-main)' }}>
        Log In
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': 'var(--color-main)' } as React.CSSProperties}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
          />
        </div>
        {error && <p className="text-red-600 text-sm">Invalid username or password.</p>}
        <button
          type="submit"
          disabled={isPending}
          className="py-2 rounded text-white text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--color-button)' }}
        >
          {isPending ? 'Logging in...' : 'Log In'}
        </button>
        <p className="text-sm text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-main)' }}>
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
