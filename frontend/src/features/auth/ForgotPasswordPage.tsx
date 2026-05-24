import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForgotPassword } from '../../api/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const { mutate, isPending, isSuccess, error } = useForgotPassword()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate({ email })
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-.02em',
            margin: '0 0 8px',
            color: 'var(--text)',
          }}
        >
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          Enter the email address associated with your account and we'll send you a reset link.
        </p>

        {isSuccess ? (
          <div
            style={{
              padding: '14px 16px',
              background: 'var(--success-bg, #f0fdf4)',
              border: '1px solid var(--success-border, #bbf7d0)',
              borderRadius: 8,
              color: 'var(--success-text, #166534)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            If that email is registered, a reset link has been sent. Check your inbox (and spam
            folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label
              htmlFor="reset-email"
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block' }}
            >
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="op-input"
              style={{ margin: '6px 0 20px' }}
              placeholder="you@example.com"
            />

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 16px' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="op-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
            >
              {isPending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
