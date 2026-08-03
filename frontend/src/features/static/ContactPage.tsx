import { useState } from 'react'
import { useContact } from '../../api/contact'
import { useSettings } from '../../api/settings'
import { useText } from '../../text'

const FIELDS = [
  { name: 'name', textKey: 'contact.field.name' },
  { name: 'email', textKey: 'contact.field.email' },
  { name: 'subject', textKey: 'contact.field.subject' },
] as const

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 6,
}

export function ContactPage() {
  const { mutate: submit, isPending, isSuccess, error } = useContact()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const { data: settings } = useSettings()
  const t = useText()

  if (isSuccess) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--success)', fontWeight: 500, fontSize: 18, margin: '0 0 8px' }}>
          {t('contact.success.title')}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
          {t('contact.success.body')}
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-.02em',
          color: 'var(--text)',
          margin: '0 0 24px',
        }}
      >
        {t('contact.title')}
      </h1>

      {settings?.contact && (
        <div
          style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text)', marginBottom: 24 }}
          dangerouslySetInnerHTML={{ __html: settings.contact }}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(form)
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {FIELDS.map(({ name, textKey }) => (
          <div key={name}>
            <label htmlFor={`contact-${name}`} style={labelStyle}>
              {t(textKey)}
            </label>
            <input
              id={`contact-${name}`}
              type={name === 'email' ? 'email' : 'text'}
              value={form[name]}
              onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
              required
              className="op-input"
            />
          </div>
        ))}

        <div>
          <label htmlFor="contact-message" style={labelStyle}>
            {t('contact.field.message')}
          </label>
          <textarea
            id="contact-message"
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
            rows={6}
            className="op-input"
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{t('contact.error')}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="op-btn primary"
          style={{ justifyContent: 'center', padding: '10px', fontSize: 14 }}
        >
          {isPending ? t('contact.submitting') : t('contact.submit')}
        </button>
      </form>
    </div>
  )
}
