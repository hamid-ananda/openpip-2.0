import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useRegister } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import { useText } from '../../text'

const BENEFITS = [
  { titleKey: 'auth.register.benefit1.title', descKey: 'auth.register.benefit1.desc' },
  { titleKey: 'auth.register.benefit2.title', descKey: 'auth.register.benefit2.desc' },
  { titleKey: 'auth.register.benefit3.title', descKey: 'auth.register.benefit3.desc' },
  { titleKey: 'auth.register.benefit4.title', descKey: 'auth.register.benefit4.desc' },
]

function PasswordStrength({ password }: { password: string }) {
  const score = Math.min(
    4,
    [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(
      Boolean
    ).length
  )
  const colors = ['var(--border)', 'var(--danger)', 'var(--warn)', 'var(--success)', 'var(--success)']
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            flex: 1,
            height: 3,
            background: i <= score ? colors[score] : 'var(--border)',
            borderRadius: 2,
            transition: 'background .2s',
          }}
        />
      ))}
    </div>
  )
}

export function RegisterPage() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const { mutate: register, isPending, isSuccess, error } = useRegister()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [localError, setLocalError] = useState('')
  const t = useText()

  if (isLoggedIn) return <Navigate to="/" replace />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    if (form.password !== form.confirm) {
      setLocalError(t('auth.register.mismatch'))
      return
    }
    register({ username: form.username, email: form.email, password: form.password })
  }

  if (isSuccess) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 56px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'color-mix(in oklab, var(--success) 14%, transparent)',
              color: 'var(--success)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>
            {t('auth.register.success.title')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            {t('auth.register.success.body')}
          </p>
          <Link to="/login" className="op-btn primary" style={{ justifyContent: 'center' }}>
            {t('auth.register.success.cta')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 56px)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}
    >
      {/* Form side */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 80px',
          background: 'var(--surface)',
          overflow: 'auto',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-.02em',
              margin: '0 0 6px',
              color: 'var(--text)',
            }}
          >
            {t('auth.register.title')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
            {t('auth.register.subtitle')}
          </p>

          <form onSubmit={handleSubmit}>
            <label
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block' }}
            >
              {t('auth.register.username')}
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              required
              className="op-input"
              style={{ margin: '6px 0 14px' }}
            />

            <label
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block' }}
            >
              {t('auth.register.email')}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder={t('auth.register.emailPlaceholder')}
              className="op-input"
              style={{ margin: '6px 0 14px' }}
            />

            <label
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block' }}
            >
              {t('auth.register.password')}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="op-input"
              style={{ margin: '6px 0 6px' }}
            />
            <PasswordStrength password={form.password} />

            <label
              style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', display: 'block' }}
            >
              {t('auth.register.confirm')}
            </label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
              className="op-input"
              style={{ margin: '6px 0 18px' }}
            />

            {(localError || error) && (
              <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 14px' }}>
                {localError || t('auth.register.error')}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="op-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
            >
              {isPending ? t('auth.register.submitting') : t('auth.register.submit')}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '20px 0',
                color: 'var(--text-soft)',
                fontSize: 11,
              }}
            >
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              {t('auth.divider')}
              <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              className="op-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
            >
              {t('auth.register.orcid')}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-muted)' }}>
            {t('auth.register.existingPrompt')}{' '}
            <Link
              to="/login"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              {t('auth.register.existingLink')}
            </Link>
          </p>
        </div>
      </div>

      {/* Benefits panel */}
      <div
        style={{
          background: 'var(--surface-2)',
          borderLeft: '1px solid var(--border)',
          padding: '64px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 16,
            }}
          >
            {t('auth.register.benefitsEyebrow')}
          </div>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: '-.02em',
              margin: '0 0 32px',
              lineHeight: 1.2,
              color: 'var(--text)',
            }}
          >
            {t('auth.register.benefitsHeading')}
          </h2>
          {BENEFITS.map(({ titleKey, descKey }, i) => (
            <div
              key={titleKey}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 0',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'var(--primary-soft)',
                  color: 'var(--primary)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: 'var(--text)' }}>
                  {t(titleKey)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t(descKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
