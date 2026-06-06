import { useSettings } from '../../api/settings'

export function FAQPage() {
  const { data: settings, isLoading } = useSettings()

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
        Frequently Asked Questions
      </h1>
      {settings?.faq ? (
        <div
          style={{ lineHeight: 1.7, fontSize: 14, color: 'var(--text)' }}
          dangerouslySetInnerHTML={{ __html: settings.faq }}
        />
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          No FAQ content has been set. Add content in Admin → FAQs.
        </p>
      )}
    </div>
  )
}
