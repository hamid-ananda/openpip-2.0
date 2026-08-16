import { useSettings } from '../../api/settings'
import { useText } from '../../text'

export function ContactPage() {
  const { data: settings } = useSettings()
  const t = useText()

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

      <div
        style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text)' }}
        dangerouslySetInnerHTML={{ __html: settings?.contact || '' }}
      />
    </div>
  )
}
