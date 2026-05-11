import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRegister } from '../../api/auth'

export function RegisterPage() {
  const { mutate: register, isPending, isSuccess, error } = useRegister()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    register({ username: form.username, email: form.email, password: form.password })
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4 text-center">
        <p className="text-green-700 font-medium mb-4">Registration successful!</p>
        <Link to="/login" style={{ color: 'var(--color-main)' }}>
          Log in now
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-main)' }}>
        Create Account
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {(['username', 'email', 'password', 'confirm'] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {field === 'confirm' ? 'Confirm Password' : field}
            </label>
            <input
              type={
                field === 'password' || field === 'confirm'
                  ? 'password'
                  : field === 'email'
                    ? 'email'
                    : 'text'
              }
              value={form[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        ))}
        {(localError || error) && (
          <p className="text-red-600 text-sm">
            {localError || 'Registration failed. Please try again.'}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="py-2 rounded text-white text-sm font-medium disabled:opacity-60"
          style={{ background: 'var(--color-button)' }}
        >
          {isPending ? 'Registering...' : 'Create Account'}
        </button>
        <p className="text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-main)' }}>
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
