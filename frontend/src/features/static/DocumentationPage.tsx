import type { CSSProperties } from 'react'
import { useText, parsePipeList } from '../../text'

const h2Style: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: '-.01em',
  color: 'var(--text)',
  margin: '0 0 12px',
}

const h3Style: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text)',
  margin: '16px 0 8px',
}

const pStyle: CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
  lineHeight: 1.7,
  margin: '0 0 12px',
}

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  fontSize: 13,
  color: 'var(--text-muted)',
  lineHeight: 1.8,
}

const codeStyle: CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 12,
  background: 'var(--surface-2)',
  borderRadius: 4,
  padding: '1px 5px',
  color: 'var(--text)',
}

/** A list whose items are `code | description` lines. */
function CodeList({ value }: { value: string }) {
  const rows = parsePipeList(value)
  if (rows.length === 0) return null
  return (
    <ul style={listStyle}>
      {rows.map(({ term, description }) => (
        <li key={term}>
          <code style={codeStyle}>{term}</code>
          {description && ` - ${description}`}
        </li>
      ))}
    </ul>
  )
}

/** A list whose items are `term | description` lines, term in bold. */
function TermList({ value }: { value: string }) {
  const rows = parsePipeList(value)
  if (rows.length === 0) return null
  return (
    <ul style={listStyle}>
      {rows.map(({ term, description }) => (
        <li key={term}>
          <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{term}</strong>
          {description && ` - ${description}`}
        </li>
      ))}
    </ul>
  )
}

function Section({
  heading,
  body,
  children,
}: {
  heading: string
  body?: string
  children?: React.ReactNode
}) {
  if (!heading.trim() && !body?.trim() && !children) return null
  return (
    <section style={{ marginBottom: 36 }}>
      {heading.trim() && <h2 style={h2Style}>{heading}</h2>}
      {body?.trim() && <p style={pStyle}>{body}</p>}
      {children}
    </section>
  )
}

export function DocumentationPage() {
  const t = useText()

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 32px 80px' }}>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: '-.02em',
          color: 'var(--text)',
          margin: '0 0 32px',
        }}
      >
        {t('docs.title')}
      </h1>

      <Section heading={t('docs.searching.heading')} body={t('docs.searching.body')}>
        {t('docs.searching.examplesHeading').trim() && (
          <h3 style={h3Style}>{t('docs.searching.examplesHeading')}</h3>
        )}
        <CodeList value={t('docs.searching.examples')} />
      </Section>

      <Section heading={t('docs.filtering.heading')} body={t('docs.filtering.body')}>
        <TermList value={t('docs.filtering.items')} />
      </Section>

      <Section heading={t('docs.downloading.heading')} body={t('docs.downloading.body')}>
        <TermList value={t('docs.downloading.items')} />
      </Section>

      <Section heading={t('docs.network.heading')} body={t('docs.network.body')} />
    </div>
  )
}
