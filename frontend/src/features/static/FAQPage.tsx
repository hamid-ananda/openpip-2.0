import { useSettings } from '../../api/settings'
import { useText } from '../../text'

export function FAQPage() {
  const { data: settings, isLoading } = useSettings()
  const t = useText()

  if (isLoading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-.02em',
          marginBottom: 28,
          color: 'var(--text)',
        }}
      >
        {t('faq.title')}
      </h1>
      {settings?.faq ? (
        <div
          style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text)' }}
          dangerouslySetInnerHTML={{ __html: settings.faq }}
        />
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          {t('faq.empty')}
        </p>
      )}
    </div>
  )
}
