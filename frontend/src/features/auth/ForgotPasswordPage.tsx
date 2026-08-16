import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSecurityAnswer, useSecurityQuestion } from '../../api/auth'
import { useText } from '../../text'

const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
  display: 'block',
} as const

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const navigate = useNavigate()
  const t = useText()

  const lookup = useSecurityQuestion()
  const verify = useSecurityAnswer()

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    lookup.mutate(
      { email },
      {
        onSuccess: (data) => {
          setQuestions(data.questions)
          setAnswers(data.questions.map(() => ''))
        },
      }
    )
  }

  const handleAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    verify.mutate(
      { email, answers },
      {
        onSuccess: (data) =>
          navigate(`/reset-password?uid=${data.uid}&token=${encodeURIComponent(data.token)}`),
      }
    )
  }

  const errorDetail = (err: unknown) =>
    (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail

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
          {questions.length
            ? 'Answer all three security questions you chose when you registered.'
            : 'Enter the email address associated with your account.'}
        </p>

        {questions.length ? (
          <form onSubmit={handleAnswer}>
            {questions.map((question, i) => (
              <div key={question} style={{ marginBottom: 16 }}>
                <label htmlFor={`reset-answer-${i}`} style={labelStyle}>
                  {question}
                </label>
                <input
                  id={`reset-answer-${i}`}
                  type="text"
                  value={answers[i] ?? ''}
                  onChange={(e) =>
                    setAnswers((a) => a.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  required
                  autoFocus={i === 0}
                  className="op-input"
                  style={{ marginTop: 6 }}
                />
              </div>
            ))}

            {verify.error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 16px' }}>
                {errorDetail(verify.error) ?? 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={verify.isPending}
              className="op-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
            >
              {verify.isPending ? 'Checking…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLookup}>
            <label htmlFor="reset-email" style={labelStyle}>
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
              placeholder={t('auth.forgot.emailPlaceholder')}
            />

            {lookup.error && (
              <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 16px' }}>
                {errorDetail(lookup.error) ?? 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={lookup.isPending}
              className="op-btn primary"
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }}
            >
              {lookup.isPending ? t('auth.forgot.submitting') : 'Continue'}
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
